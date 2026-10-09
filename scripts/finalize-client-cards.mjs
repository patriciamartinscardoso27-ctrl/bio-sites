import fs from 'node:fs/promises'
let app=await fs.readFile('src/App.tsx','utf8')
app=app.replace('<Eye size={14}/> Prévia','<Eye size={14}/> Visualizar')
app=app.replace('<button aria-label={`Duplicar ${s.name}`}','<button disabled={busy} onClick={()=>void open(s.id,\'client\')}>Gerenciar</button><button aria-label={`Duplicar ${s.name}`}')
await fs.writeFile('src/App.tsx',app)
