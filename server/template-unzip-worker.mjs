import {parentPort,workerData} from 'node:worker_threads'
import {unzipSync} from 'fflate'
try{const inventory=new Map(workerData.inventory),files=unzipSync(new Uint8Array(workerData.bytes),{filter:file=>inventory.has(file.name)&&file.originalSize===inventory.get(file.name)});parentPort.postMessage({ok:true,files})}catch{parentPort.postMessage({ok:false})}
