#!/usr/bin/env python3
"""Download verified public standards into a project-owned versioned cache."""

import argparse
import hashlib
import json
import re
import shutil
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from urllib.parse import urlparse
from urllib.request import Request, urlopen

BASE = "https://organisationswerkstatt.netlify.app/standards/"


def fetch(url):
    request = Request(url, headers={"Cache-Control": "no-cache", "User-Agent": "Organisationsstandards/0.4.0"})
    with urlopen(request, timeout=30) as response:
        if not response.geturl().startswith(BASE):
            raise ValueError("Abruf wurde auf einen anderen Quellenort umgeleitet.")
        data = response.read(2_000_001)
        if len(data) > 2_000_000:
            raise ValueError("Paketdatei ist unerwartet gross.")
        return data


def checked_manifest(raw):
    manifest = json.loads(raw)
    version = manifest.get("package_version", "")
    if manifest.get("schema_version") != 1 or not re.fullmatch(r"\d+\.\d+\.\d+", version):
        raise ValueError("Unbekanntes Paketformat oder ungueltige Version.")
    if not re.fullmatch(r"[0-9a-f]{64}", manifest.get("content_sha256", "")):
        raise ValueError("Paketpruefsumme fehlt.")
    files = manifest.get("files", [])
    if not files or len(files) > 100:
        raise ValueError("Pruefbare Dateiliste fehlt oder ist zu gross.")
    names = set()
    for file in files:
        name = file.get("path", "")
        path = PurePosixPath(name)
        if not name or path.is_absolute() or ".." in path.parts or str(path) != name or "\\" in name or ":" in name:
            raise ValueError("Ungueltiger Dateipfad im Paket.")
        if name in names or file.get("url") != BASE + "downloads/" + name:
            raise ValueError("Doppelter Dateipfad oder fremder Quellenort.")
        if not re.fullmatch(r"[0-9a-f]{64}", file.get("sha256", "")):
            raise ValueError("Dateipruefsumme fehlt.")
        if type(file.get("bytes")) is not int or not 0 <= file["bytes"] <= 2_000_000:
            raise ValueError("Ungueltige Dateigroesse.")
        names.add(name)
    if not {"README.md", "QUELLEN.md", "ORG-001.md", "ORG-002.md", "ORG-003.md"}.issubset(names):
        raise ValueError("Das Paket ist unvollstaendig.")
    if not isinstance(manifest.get("status"), str) or not manifest.get("standards"):
        raise ValueError("Fachlicher Status oder Standardfassungen fehlen.")
    for standard in manifest["standards"]:
        if not re.fullmatch(r"ORG-\d{3}", standard.get("id", "")) or not re.fullmatch(r"\d+\.\d+\.\d+", standard.get("version", "")) or not isinstance(standard.get("status"), str):
            raise ValueError("Standardkennung, Fassung oder Status ist ungueltig.")
    return manifest


def verify(directory, manifest):
    joined = []
    for file in manifest["files"]:
        path = directory / file["path"]
        if path.is_symlink() or any(p.is_symlink() for p in path.parents if p != directory.parent):
            raise ValueError("Verknuepfungen in einer Paketfassung sind nicht erlaubt.")
        data = path.read_bytes()
        if len(data) != file["bytes"] or hashlib.sha256(data).hexdigest() != file["sha256"]:
            raise ValueError("Dateipruefung fehlgeschlagen: " + file["path"])
        joined.append(file["path"] + "\n" + data.decode("utf-8"))
    if hashlib.sha256("\n".join(joined).encode("utf-8")).hexdigest() != manifest["content_sha256"]:
        raise ValueError("Gesamtpruefsumme des Pakets stimmt nicht.")


def write_json(path, value):
    if path.is_symlink():
        raise ValueError("Vorhandene Verknuepfung bleibt unveraendert.")
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=str(path.parent), delete=False) as handle:
        handle.write(json.dumps(value, ensure_ascii=False, indent=2) + "\n")
        temp = Path(handle.name)
    try:
        temp.replace(path)
    finally:
        if temp.exists():
            temp.unlink()


def sync(project_dir, fetcher=fetch):
    project = Path(project_dir).expanduser().resolve(strict=True)
    if not project.is_dir():
        raise ValueError("Projektordner ist kein Verzeichnis.")
    manifest_raw = fetcher(BASE + "current.json")
    manifest = checked_manifest(manifest_raw)
    cache = project / "organisationsstandards"
    if cache.is_symlink():
        raise ValueError("Der Ablageordner darf keine Verknuepfung sein.")
    marker = cache / ".standards-cache.json"
    if cache.exists():
        if not cache.is_dir():
            raise ValueError("Der Ablageort ist kein Ordner.")
        if any(cache.iterdir()) and (not marker.is_file() or marker.is_symlink() or json.loads(marker.read_text(encoding="utf-8")).get("source_url") != BASE):
            raise ValueError("Vorhandener fremder Ablageordner bleibt unveraendert.")
    cache.mkdir(exist_ok=True)
    lock = cache / ".sync-lock"
    try:
        lock.mkdir()
    except FileExistsError:
        raise ValueError("Ein anderer Abruf arbeitet bereits in diesem Ordner.")
    staging = None
    try:
        if not marker.exists():
            write_json(marker, {"schema_version": 1, "source_url": BASE})
        versions = cache / "fassungen"
        if versions.is_symlink():
            raise ValueError("Der Fassungsordner darf keine Verknuepfung sein.")
        versions.mkdir(exist_ok=True)
        staging = Path(tempfile.mkdtemp(prefix=".abruf-", dir=str(cache)))
        for file in manifest["files"]:
            path = staging / file["path"]
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(fetcher(file["url"]))
        verify(staging, manifest)
        latest = checked_manifest(fetcher(BASE + "current.json"))
        if latest != manifest:
            raise ValueError("Onlinefassung hat sich waehrend des Abrufs geaendert. Erneut abrufen.")
        (staging / "current.json").write_bytes(manifest_raw)
        folder = "fassungen/" + manifest["package_version"] + "-" + manifest["content_sha256"][:12]
        target = cache / folder
        if target.exists():
            verify(target, manifest)
            if (target / "current.json").read_bytes() != manifest_raw:
                raise ValueError("Vorhandener Quellenstand weicht ab und bleibt unveraendert.")
        else:
            staging.rename(target)
            staging = None
        verify(target, manifest)
        pointer = {"schema_version": 1, "source_url": BASE + "current.json", "package_version": manifest["package_version"], "content_sha256": manifest["content_sha256"], "folder": folder, "checked_at": datetime.now(timezone.utc).isoformat(), "status": manifest.get("status"), "files": len(manifest["files"]), "verification": "sha256-after-local-write", "standards": [{"id": s["id"], "version": s["version"], "status": s["status"]} for s in manifest["standards"]]}
        write_json(cache / "AKTUELL.json", pointer)
        return {**pointer, "local_folder": str(target)}
    finally:
        if staging is not None:
            shutil.rmtree(staging)
        lock.rmdir()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project-dir", required=True, help="Tatsaechlich freigegebener lokaler Projektordner")
    args = parser.parse_args()
    try:
        print(json.dumps(sync(args.project_dir), ensure_ascii=False, indent=2))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print("Abruf nicht aktiviert: " + str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
