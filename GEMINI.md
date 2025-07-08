# Gemini CLI Agent Instructions

This document outlines the operational guidelines for the Gemini CLI agent when working on this project.

## Workflow for New Tasks

For every new task or feature request, the following workflow must be adhered to:

1.  **Task Description:**
    *   Clearly state the task or feature to be implemented.
    *   This should be a concise summary of the user's request.

2.  **Detailed Plan:**
    *   Provide a detailed, step-by-step plan on how the task will be executed.
    *   Include specific file modifications, new file creations, and any shell commands to be run.
    *   Justify the technical choices made (e.g., why a particular library or approach is chosen).
    *   Mention any potential challenges or considerations.

3.  **Execution:**
    *   Execute the plan using the available tools.
    *   Provide concise updates on progress.

4.  **Changelog Update:**
    *   After completing the task, append a log of the changes made to `aidocs/changelog.md`.
    *   The log entry should include:
        *   Date and time of completion.
        *   A brief description of the task.
        *   A summary of the files modified or created.
        *   Any significant decisions or outcomes.

## Project Structure Documentation

*   Maintain `aidocs/structure.md` with an up-to-date overview of the project's folder and file structure.
*   Each entry in `structure.md` should briefly describe the purpose or content of the file/folder.

## Changelog Format

The `aidocs/changelog.md` file should follow a simple markdown list format, with each entry prefixed by the date and time.

Example:
```markdown
# Changelog

- [YYYY-MM-DD HH:MM:SS] Task: Implemented feature X. Modified `file1.py`, `file2.js`. Added `new_file.txt`.
- [YYYY-MM-DD HH:MM:SS] Task: Fixed bug Y. Modified `buggy_file.py`.
```
