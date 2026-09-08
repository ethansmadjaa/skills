import importlib.util
import copy
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "ship-state.py"
spec = importlib.util.spec_from_file_location("ship_state", SCRIPT)
state = importlib.util.module_from_spec(spec)
spec.loader.exec_module(state)


class ShipStateTest(unittest.TestCase):
    def test_real_git_rename_dirty_file_and_unusual_untracked_name(self):
        with tempfile.TemporaryDirectory() as directory:
            def git(*args):
                return subprocess.run(["git", "-C", directory, *args], check=True, capture_output=True)
            git("init", "-b", "feature")
            git("config", "user.email", "test@example.invalid")
            git("config", "user.name", "Test")
            original = Path(directory) / "original.txt"
            original.write_text("original\n")
            git("add", "original.txt")
            git("commit", "-m", "base")
            git("branch", "base")
            git("mv", "original.txt", "renamed file.txt")
            (Path(directory) / "renamed file.txt").write_text("changed\n")
            (Path(directory) / "new\nfile.txt").write_text("untracked\n")
            result = subprocess.run(["python3", str(SCRIPT), "--cwd", directory, "status", "--base", "base"], capture_output=True, check=True)
            data = json.loads(result.stdout)
            self.assertEqual(data["files"]["staged"][0]["from"], "original.txt")
            self.assertEqual(data["files"]["unstaged"][0]["path"], "renamed file.txt")
            self.assertEqual(data["files"]["untracked"][0]["path"], "new\nfile.txt")
            self.assertIsNone(data["outgoing_commits"])
            self.assertEqual(data["branch_commits"], [])
            self.assertEqual(git("diff", "--cached", "--name-status").stdout, b"R100\toriginal.txt\trenamed file.txt\n")

    def test_conflicts_and_detached_or_unborn_head_are_not_clean(self):
        self.assertEqual(len(state.files(b"UU conflict\0AA both\0")["conflicts"]), 2)
        with tempfile.TemporaryDirectory() as directory:
            subprocess.run(["git", "init", directory], check=True, capture_output=True)
            result = subprocess.run(["python3", str(SCRIPT), "--cwd", directory, "status"], check=True, capture_output=True)
            self.assertIsNone(json.loads(result.stdout)["head"])

    def test_pr_3620_keeps_coderabbit_finding_replies_reviews_and_conversation(self):
        def response(value, code=0, error=b""):
            return subprocess.CompletedProcess([], code, json.dumps(value).encode(), error)
        fixture = json.loads((Path(__file__).parent / "fixtures/pr-3620.json").read_text())
        threads = copy.deepcopy(fixture["threads"])
        inline = [comment for thread in threads for comment in thread["comments"]["nodes"]]
        for thread in threads:
            root = thread["comments"]["nodes"][0]
            thread["comments"]["nodes"] = [{"id": root["node_id"], "databaseId": root["id"]}]
        def rest(items):
            return [{**item, "user": {"login": item["author"]}} for item in items]
        pages = [{"data": {"repository": {"pullRequest": {"headRefOid": fixture["headRefOid"], "number": 3620,
                  "reviewThreads": {"nodes": threads}}}}}]
        responses = [response(pages), response([rest(inline[:1]), rest(inline[1:])]),
                     response([rest(fixture["reviews"])]), response([rest(fixture["conversation_comments"])]),
                     response([{"name": "tests", "bucket": "pending", "state": "QUEUED"}], 8),
                     subprocess.CompletedProcess([], 1, b"", b"no required checks reported"),
                     response({"headRefOid": fixture["headRefOid"]})]
        with patch.object(state, "run", side_effect=responses) as runner:
            result = state.pr("example-org/example-repo", 3620)
        for call in runner.call_args_list[:4]:
            self.assertIn("--paginate", call.args)
        self.assertEqual(result["threads"], fixture["threads"])
        self.assertEqual(result["reviews"], fixture["reviews"])
        self.assertEqual(result["conversation_comments"], fixture["conversation_comments"])
        comments = result["threads"][0]["comments"]["nodes"]
        self.assertEqual(len(comments), 3)
        self.assertIn("Guard the URL construction", comments[0]["body"])
        self.assertIn("Fixed in bdb7885", comments[1]["body"])
        self.assertTrue(result["threads"][0]["isResolved"])
        self.assertIsNone(result["required_checks"]["items"])
        self.assertEqual(result["checks"]["items"][0]["bucket"], "pending")

    def test_comment_race_fails_instead_of_silently_dropping_feedback(self):
        thread = {"comments": {"totalCount": 2, "nodes": [{"databaseId": 1}]}}
        root = {"id": 1, "body": "Finding", "user": {"login": "reviewer"}}
        responses = [subprocess.CompletedProcess([], 0, json.dumps(pages).encode()) for pages in ([[root]], [], [])]
        with patch.object(state, "run", side_effect=responses):
            with self.assertRaisesRegex(RuntimeError, "comments changed"):
                state.feedback("owner/repo", 42, [thread])

    def test_feedback_without_inline_threads_is_still_returned(self):
        review = {"id": 1, "body": "Out-of-diff finding", "user": {"login": "coderabbitai[bot]"}}
        comment = {"id": 2, "body": "Pre-merge warning", "user": {"login": "coderabbitai[bot]"}}
        responses = [subprocess.CompletedProcess([], 0, json.dumps(pages).encode())
                     for pages in ([], [[review]], [[comment]])]
        with patch.object(state, "run", side_effect=responses):
            before = state.feedback("owner/repo", 42, [])
        self.assertEqual(before["reviews"][0]["body"], "Out-of-diff finding")
        self.assertEqual(before["conversation_comments"][0]["body"], "Pre-merge warning")

    def test_head_race_is_an_error(self):
        pages = [{"data": {"repository": {"pullRequest": {"headRefOid": head}}}} for head in ("old", "new")]
        with patch.object(state, "run", return_value=subprocess.CompletedProcess([], 0, json.dumps(pages).encode())):
            with self.assertRaisesRegex(RuntimeError, "head changed"):
                state.pr("owner/repo", 42)



if __name__ == "__main__":
    unittest.main()
