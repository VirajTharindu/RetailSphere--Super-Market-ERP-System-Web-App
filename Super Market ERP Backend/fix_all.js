const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            if (dir.includes('services')) {
                // simple parameters
                const replaceRules = [
                    [/async function (\w+)\(id\)/g, 'async function $1(id: any)'],
                    [/async function (\w+)\(data\)/g, 'async function $1(data: any)'],
                    [/async function (\w+)\(batchId\)/g, 'async function $1(batchId: any)'],
                    [/async function (\w+)\(productId\)/g, 'async function $1(productId: any)'],
                    [/async function (\w+)\(\{\s*(\w+)\s*\}\)/g, 'async function $1({ $2 }: any)'],
                    [/async function (\w+)\(\{\s*([a-zA-Z0-9_, ]+)\s*\}\)/g, 'async function $1({ $2 }: any)'],
                    [/async function (\w+)\(\{\s*([a-zA-Z0-9_, ]+)\s*\} = \{\}\)/g, 'async function $1({ $2 }: any = {})'],
                    [/\(batchId, data\)/g, '(batchId: any, data: any)'],
                    [/\(id, data\)/g, '(id: any, data: any)'],
                    [/\(id, updatePayload\)/g, '(id: any, updatePayload: any)'],
                    [/\(userId\)/g, '(userId: any)'],
                    [/\(userId, data\)/g, '(userId: any, data: any)'],
                    [/\(\{ username, password \}\)/g, '({ username, password }: any)'],
                    [/\(payload\)/g, '(payload: any)'],
                    [/\(poId, data\)/g, '(poId: any, data: any)'],
                    [/\(filter = \{\}\)/g, '(filter: any = {})'],
                    [/\(productId, transaction = null\)/g, '(productId: any, transaction: any = null)'],
                    [/\({ batchId, quantity }\)/g, '({ batchId, quantity }: any)'],
                    [/\({ fName, lName, phone }\)/g, '({ fName, lName, phone }: any)'],
                    [/\(\{ productId, quantity, transaction = null \}\)/g, '({ productId, quantity, transaction = null }: any)'],
                    [/\(\{ page = 1, limit = 20, status = null, includeDetails = false, transaction = null \} = \{\}/g, '{ page = 1, limit = 20, status = null, includeDetails = false, transaction = null }: any = {'],
                    [/\(\{ limit = 10, from, to \} = \{\}/g, '{ limit = 10, from, to }: any = {'],
                    [/\(\{ threshold = null, limit = 50 \} = \{\}/g, '{ threshold = null, limit = 50 }: any = {'],
                    [/\(\{ days = 30 \} = \{\}/g, '{ days = 30 }: any = {'],
                    [/\(\{ from, to, period = \"day\" \} = \{\}/g, '{ from, to, period = "day" }: any = {'],
                    [/\(\{ from, to \} = \{\}/g, '{ from, to }: any = {'],
                    [/\(id, transaction = null\)/g, '(id: any, transaction: any = null)'],
                    [/\(id, updateData, transaction = null\)/g, '(id: any, updateData: any, transaction: any = null)'],
                    [/\(from, to\)/g, '(from: any, to: any)']
                ];

                let newContent = content;
                replaceRules.forEach(([regex, replacement]) => {
                    newContent = newContent.replace(regex, replacement as string);
                });

                if (newContent !== content) {
                    fs.writeFileSync(fullPath, newContent);
                    modified = true;
                }
            }

            if (dir.includes('controllers')) {
                if (!content.match(/import\s+{.*}\s+from\s+['"]express['"]/)) {
                    content = 'import { Request, Response, NextFunction } from "express";\n' + content;
                }
                content = content.replace(/\(req, res, next\)/g, '(req: Request, res: Response, next: NextFunction)');
                content = content.replace(/\(req, res\)/g, '(req: Request, res: Response)');
                content = content.replace(/export async function (\w+)\(req, res\)/g, 'export async function $1(req: Request, res: Response)');
                content = content.replace(/export const (\w+) = async \(req, res\)/g, 'export const $1 = async (req: Request, res: Response)');
                content = content.replace(/\(req, res, next\)/g, '(req: Request, res: Response, next: NextFunction)');
                
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}
processDir('./services');
processDir('./controllers');
console.log('done');
