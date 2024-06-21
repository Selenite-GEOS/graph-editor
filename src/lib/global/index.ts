import { readable, writable } from "svelte/store";
import { get } from 'svelte/store';
import type { GeosSchema } from "$lib/geos";
import type { Action } from "svelte/action";
import { browser } from "$app/environment";

export {getContext} from 'svelte'
export type NewGeosContext = { geosSchema: GeosSchema };

export const modeCurrent = writable(true);
export const keyboardShortcut: Action = () => {
    
}

export const _ = readable<(msg: string) => string>((msg) => {
    const msgs: Record<string, string> = {
        "editor.default-name": 'New editor',
        'notifications.error.title': 'Error'
    }

    return msgs[msg] ?? msg;
});

export const notifications = {
    show(o: unknown) {
        console.log(o)
    }
}



export function getModalStore() {
    console.warn("Not implemented")
    return undefined;
}

export class ErrorWNotif extends Error {
    constructor(
        params:
            | {
                title?: string;
                message?: string;
                emessage: string;
            }
            | string
    ) {
        let title, msg, emsg;
        if (typeof params === 'string') emsg = params;
        else ({ title, message: msg, emessage: emsg } = params);

        super(emsg);
        const browser = typeof window !== 'undefined';
        if (browser)
            notifications.show({
                title: title ?? get(_)('notifications.error.title'),
                message: msg ?? emsg,
                color: 'red'
            });
    }
}

