// import type { MakutuClasses$result } from '$houdini';
import type { UUID } from 'crypto';
import type { Url } from 'url';

export type MakutuClassRepository = Record<string, never>;

export type User = {
	id: UUID;
	image?: string;
	name: string;
	email?: string;
};

export type Session = {
	id: UUID;
	expires: Date;
	sessionToken: UUID;
	user: User;
};
