import type { IncomingMessage, ServerResponse } from 'node:http'
export function createApi(): (req: IncomingMessage, res: ServerResponse, next?: () => void) => Promise<void>
export function localRequest(req: IncomingMessage): boolean
export function canonicalLocalPage(req:IncomingMessage,res:ServerResponse,next:()=>void):void
export function createAdminPageGuard(): (req:IncomingMessage,res:ServerResponse,next:()=>void)=>Promise<void>
