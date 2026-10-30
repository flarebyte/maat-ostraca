"""Offline release-preflight contract tests."""
import io
import json
import os
from pathlib import Path
import runpy
import tempfile
import unittest
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError

SCRIPT = Path(__file__).with_name('check_release.py')

class CheckReleaseTests(unittest.TestCase):
    def run_check(self, version='1.2.3', lock_version='1.2.3', status=404, tag_status=1):
        package = {'name': 'example', 'version': version}
        lock = {**package, 'version': lock_version, 'packages': {'': package}}
        def read(path, *args, **kwargs):
            return json.dumps(lock if path.name == 'package-lock.json' else package)
        error = HTTPError('https://registry.npmjs.org/example/1.2.3', status, 'test', {}, io.BytesIO())
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / 'output'
            with patch.object(Path, 'read_text', read), patch.dict(os.environ, {'GITHUB_OUTPUT': str(output)}), patch('urllib.request.urlopen', side_effect=error), patch('subprocess.run') as git:
                git.return_value.returncode = tag_status
                runpy.run_path(str(SCRIPT), run_name='__main__')
            return output.read_text()

    def test_new_release_outputs(self):
        self.assertEqual(self.run_check(), 'version=1.2.3\ntag=v1.2.3\n')

    def test_rejects_invalid_versions(self):
        for version in ['1.2.3-beta.1', '1.2', '01.2.3', '1.2.3\ntag=bad']:
            with self.subTest(version=version), self.assertRaises(SystemExit):
                self.run_check(version=version)

    def test_rejects_lock_mismatch(self):
        with self.assertRaisesRegex(SystemExit, 'must match'):
            self.run_check(lock_version='1.2.2')

    def test_registry_failure_is_not_absence(self):
        with self.assertRaisesRegex(SystemExit, 'HTTP 503'):
            self.run_check(status=503)

    def test_existing_registry_version(self):
        with patch('urllib.request.urlopen', return_value=MagicMock()), self.assertRaisesRegex(SystemExit, 'Already published'):
            runpy.run_path(str(SCRIPT), run_name='__main__')

    def test_existing_or_unreadable_tag(self):
        for status in [0, 128]:
            with self.subTest(status=status), self.assertRaises(SystemExit):
                self.run_check(tag_status=status)

if __name__ == '__main__':
    unittest.main()
