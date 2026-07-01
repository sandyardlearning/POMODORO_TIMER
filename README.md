# Focusify — Pomodoro Timer

Lightweight Pomodoro web app (HTML/CSS/JS). This repository is configured to deploy to GitHub Pages using GitHub Actions.

Quick deploy steps (run in PowerShell from project root):

```powershell
git init
git add .
git commit -m "Initial commit: Focusify Pomodoro App"
git branch -M main
# replace <USERNAME> and <REPO> with your GitHub values
git remote add origin git@github.com:<USERNAME>/<REPO>.git
git push -u origin main
```

Notes:
- Repository uses a Pages workflow that will publish the repository root to GitHub Pages on pushes to `main`.
- If using HTTPS remote, use `https://github.com/<USERNAME>/<REPO>.git` instead of the SSH URL.

If you want me to create the repo and push for you, provide a GitHub personal access token with `repo` scope and the desired repo name.
