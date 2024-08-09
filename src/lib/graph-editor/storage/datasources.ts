import type { CallbackFsClient, PromiseFsClient } from 'isomorphic-git';
import type { Datasource, Graph } from './types';
import buffer from 'buffer/';
import type FS from '@isomorphic-git/lightning-fs';
import type { NodeEditorSaveData } from '$graph-editor/editor';

let  fsInstance: FS | undefined; 
async function getFs() {
    if (!fsInstance) {
        fsInstance = new (await import("@isomorphic-git/lightning-fs")).default('fs');
    }
    return fsInstance;
}

// @ts-expect-error
window.Buffer = buffer.Buffer;

export class GitHubDataSource implements Datasource {
    url: URL;
	constructor(url: string) {
        this.url = new URL(url);
    }

	async getGraphs(): Promise<Graph[]> {
        const fs = await getFs();
        const {clone, pull} = await import('isomorphic-git');
        const http = await import("isomorphic-git/http/web")
		console.debug('Getting graphs from GitHub', this.url.toString());
		const url = this.url;
		const pathname = url.pathname;
		const pathParts = pathname.split('/');
		const username = pathParts[1];
		const repo = pathParts[2];
		const folderPath = pathParts.slice(5).join('/');
        const repoUrl = `https://github.com/${username}/${repo}.git`;
        const dir = `/${username}-${repo}`;
        try {
            const stat = await fs.promises.stat(dir)
            console.debug('Pulling repo', repoUrl)
            pull({
                fs,
                http,
                dir,
                corsProxy: 'https://cors.isomorphic-git.org',
                author: {
                    name: 'Selenite GEOS',
                },
                
            })
        } catch (e) {
            console.debug('Cloning repo', repoUrl)
            clone({
                fs,
                http,
                url: repoUrl,
                dir,
                corsProxy: 'https://cors.isomorphic-git.org'
            });
        }
    
        const blocksPath = dir + '/' + folderPath;
        const res: Graph[] = []
        for await (const {path, content} of readFiles(blocksPath)) {
            if (!path.endsWith(".json")) continue;
            const menuPath = path.slice(blocksPath.length + 1)
            let parsed: unknown
            try {
                parsed = JSON.parse(content)
            } catch(e) {
                console.error("Invalid JSON at", menuPath)
                continue;
            }
            console.debug("Read", menuPath, parsed)
            if (path.endsWith("index.json")) {
                console.log("folder description", )
                continue;
            }
            const graphData = parsed as NodeEditorSaveData
            res.push({
                id: path,
                path: menuPath.split("/"),
                ...graphData
            })
        }
		return res;
	}
}

async function* readFiles(dir: string): AsyncGenerator<{path: string, content: string}>  {
    const fs = await getFs();
    for (const file of await fs.promises.readdir(dir)) {
        const path = dir + "/" + file
        if ((await fs.promises.stat(path)).isFile()) {
            yield {path, content: (await fs.promises.readFile(path)).toString()}
        } else {
            for await (const f of readFiles(path)) {
                yield f
            }
        }
    }
}