rm -rf src public dist node_modules package.json package-lock.json pnpm-lock.yaml index.html vite.config.ts tsconfig.json tsconfig.node.json tailwind.config.js postcss.config.js README.md sandbox.zip
unzip sandbox.zip
npm install
npm run build
rm -rf node_modules
rm -rf dist
rm -rf ~/.npm
df -h
npm install
cd ~
rm -rf ~/.npm
rm -rf ~/suivi-gestalt-therapie/node_modules
rm -rf ~/suivi-gestalt-therapie/dist
rm -rf ~/suivi-gestalt-therapie/.firebase
find ~ -maxdepth 1 -name "*.zip" -delete
find ~ -maxdepth 1 -name "*.tgz" -delete
df -h
cd ~/suivi-gestalt-therapie
ls
ls *.zip
git init
git add .
git commit -m "première version"
git branch -M main
git remote add origin https://github.com/acbiron/suivi-gestalt-therapie.git
git push -u origin main
cd ~
pwd
ls
git config --global user.name "Anne-Cécile Biron"
git config --global user.email "contact@acbiron-therapie.fr"
git rm --cached -r .gemini/extensions/vertex
printf ".gemini/\nnode_modules/\ndist/\n" >> .gitignore
