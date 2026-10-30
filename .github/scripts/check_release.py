
import json
import os
import re
import subprocess
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

package = json.loads(Path("package.json").read_text())
name = package["name"]
version = package["version"]
if not isinstance(name, str) or not name or package.get("private"):
    raise SystemExit("Release requires a public package name")
if not isinstance(version, str) or not re.fullmatch(
    r"(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)", version
):
    raise SystemExit("Release version must be stable SemVer (major.minor.patch)")
lock = json.loads(Path("package-lock.json").read_text())
root = lock.get("packages", {}).get("", {})
if any(item.get("name") != name or item.get("version") != version for item in (lock, root)):
    raise SystemExit("package.json and package-lock.json name/version must match")
tag = f"v{version}"

# Check the exact version in the public npm registry
encoded = urllib.parse.quote(name, safe="")
url = f"https://registry.npmjs.org/{encoded}/{version}"

try:
    with urllib.request.urlopen(url, timeout=15):
        raise SystemExit(f"Already published: {name}@{version}")
except urllib.error.HTTPError as error:
    error.close()
    if error.code != 404:
        raise SystemExit(f"Unable to check npm registry: HTTP {error.code}") from error
except (urllib.error.URLError, TimeoutError) as error:
    raise SystemExit(f"Unable to check npm registry: {error}") from error

# Check existing Git tags
result = subprocess.run(
    ["git", "show-ref", "--verify", "--quiet", f"refs/tags/{tag}"],
    check=False,
)

if result.returncode == 0:
    raise SystemExit(f"Git tag already exists: {tag}")
if result.returncode != 1:
    raise SystemExit("Unable to check Git tags")

# Expose values to following GitHub Actions steps
with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as output:
    output.write(f"version={version}\n")
    output.write(f"tag={tag}\n")

print(f"Release validated: {name}@{version}")
