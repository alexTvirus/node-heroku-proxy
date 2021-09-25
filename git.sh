git remote add origin https://github.com/alexTvirus/node-heroku-proxy.git

git fetch origin main

# Hard reset
git reset --hard origin/main

# Force pull
git pull origin main --force
