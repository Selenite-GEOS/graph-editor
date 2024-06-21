// import {
// 	CreateAccountStore,
// 	CreateSessionStore,
// 	CreateUserStore,
// 	DeleteSessionStore,
// 	SessionAndUserStore,
// 	UpdateSessionStore,
// 	UserAuthInfoStore,
// 	UserCreateInput
// } from '$houdini';
// import type {
// 	Adapter,
// 	AdapterAccount,
// 	AdapterSession,
// 	AdapterUser,
// 	VerificationToken
// } from '@auth/core/adapters';
// import type { Awaitable } from '@auth/core/types';
// import type { RequestEvent } from '@sveltejs/kit';
// import type { UUID } from 'crypto';

// // This function returns an object from an object where every property has been converted to camel case
// // This is used to convert the properties of the user object to camel case
// // function toCamelCase(obj: any) {
// //     if (typeof obj !== "object" || obj === null) {
// //         return obj;
// //     }
// //     const camelCaseObj: any = {};
// //     for (const key of Object.keys(obj)) {
// //         const value = obj[key];
// //         const camelCaseKey = key.replace(/([-_][a-z])/gi, ($1) => {
// //             return $1.toUpperCase().replace("_", "");
// //         });
// //         camelCaseObj[camelCaseKey] = toCamelCase(value);
// //     }
// //     return camelCaseObj;
// // }

// // This function returns an object from an object where every property whose name is in an array has been converted to camel case
// // This is used to convert the properties of the user object to camel case
// function toCamelCase(obj: any) {
// 	if (typeof obj !== 'object' || obj === null) {
// 		return obj;
// 	}
// 	const camelCaseObj: any = {};
// 	for (const key of Object.keys(obj)) {
// 		const value = obj[key];
// 		const camelCaseKey = key.replace(/([-_][a-z])/gi, ($1) => {
// 			return $1.toUpperCase().replace('_', '');
// 		});
// 		camelCaseObj[camelCaseKey] = toCamelCase(value);
// 	}
// 	return camelCaseObj;
// }

// // 1. Simplest form, a plain object.
// export function GraphQlAdapter(event: RequestEvent): Adapter {
// 	return {
// 		async createUser(user: Omit<AdapterUser, 'id'>) {
// 			console.log('GraphQlAdapter : createUser : user : ', user);
// 			const store = new CreateUserStore();
// 			const data = (await store.mutate({ user: user }, { event })).data;
// 			const createdUser = data?.createUser;
// 			if (createdUser == null) {
// 				throw new Error('User creation failed');
// 			}
// 			return createdUser;
// 		},
// 		async getUser(id: UUID) {
// 			console.log('GraphQlAdapter : getUser : id : ', id);
// 			const userAuthInfo = new UserAuthInfoStore();
// 			const user = (await userAuthInfo.fetch({ event, variables: { id: id } })).data?.user;
// 			if (user == undefined) {
// 				return null;
// 			}
// 			return user;
// 		},
// 		async getUserByEmail(email: string) {
// 			console.log('GraphQlAdapter : getUserByEmail : email : ', email);
// 			const userAuthInfo = new UserAuthInfoStore();
// 			const user = (await userAuthInfo.fetch({ event, variables: { email: email } })).data?.user;
// 			if (user == undefined) {
// 				return null;
// 			}
// 			return user;
// 		},
// 		/** Using the provider id and the id of the user for a specific account, get the user. */
// 		async getUserByAccount(provider) {
// 			console.log('GraphQlAdapter : getUserByAccount : provider : ', provider);
// 			provider = provider;
// 			const userAuthInfo = new UserAuthInfoStore();
// 			const user = (await userAuthInfo.fetch({ event, variables: { provider: provider } })).data
// 				?.user;
// 			if (user == undefined) {
// 				return null;
// 			}
// 			return user;
// 		},
// 		updateUser(user: Partial<AdapterUser>): Awaitable<AdapterUser> {
// 			throw new Error('Method not implemented.');
// 		},
// 		/** @todo This method is currently not invoked yet. */
// 		deleteUser(userId: string): Promise<void> | Awaitable<AdapterUser | null | undefined> {
// 			throw new Error('Method not implemented.');
// 		},
// 		/**
// 		 * This method is invoked internally (but optionally can be used for manual linking).
// 		 * It creates an [Account](https://authjs.dev/reference/adapters#models) in the database.
// 		 */
// 		async linkAccount(account: AdapterAccount) {
// 			console.log('GraphQlAdapter : linkAccount : account : ', account);
// 			const createAccount = new CreateAccountStore();
// 			const data = (await createAccount.mutate({ account: account }, { event })).data;
// 			const createdAccount = data?.createAccount;
// 			if (createdAccount == null) {
// 				throw new Error('Account creation failed');
// 			}
// 		},
// 		/** @todo This method is currently not invoked yet. */
// 		unlinkAccount(
// 			providerAccountId: Pick<AdapterAccount, 'provider' | 'providerAccountId'>
// 		): Promise<void> | Awaitable<AdapterAccount | undefined> {
// 			throw new Error('Method not implemented.');
// 		},
// 		/** Creates a session for the user and returns it. */
// 		async createSession(session: {
// 			sessionToken: string;
// 			userId: string;
// 			expires: Date;
// 		}): Promise<AdapterSession> {
// 			console.log('GraphQlAdapter : createSession : session : ', session);
// 			const createSession = new CreateSessionStore();
// 			const data = (await createSession.mutate({ session: session }, { event })).data;
// 			const createdSession = data?.createSession;
// 			if (createdSession == null) {
// 				throw new Error('Session creation failed');
// 			}
// 			return createdSession;
// 		},
// 		async getSessionAndUser(
// 			sessionToken: string
// 		): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
// 			console.log('GraphQlAdapter : getSessionAndUser : sessionToken : ', sessionToken);
// 			const sessionAndUser = new SessionAndUserStore();
// 			const data = (
// 				await sessionAndUser.fetch({ event, variables: { sessionToken: sessionToken } })
// 			).data;
// 			const session = data?.session;
// 			const user = data?.session?.user;
// 			if (session == null || user == null) {
// 				return null;
// 			}
// 			console.log('GraphQlAdapter : getSessionAndUser : session : ', session);
// 			return { session: session, user: user };
// 		},
// 		async updateSession(
// 			session: Partial<AdapterSession> & Pick<AdapterSession, 'sessionToken'>
// 		): Promise<AdapterSession | null | undefined> {
// 			console.log('GraphQlAdapter : updateSession : session : ', session);
// 			const updateSession = new UpdateSessionStore();
// 			const data = (await updateSession.mutate({ session: session }, { event })).data;
// 			if (data == null) {
// 				return null;
// 			}
// 			return data.updateSession;
// 		},
// 		/**
// 		 * Deletes a session from the database. It is preferred that this method also
// 		 * returns the session that is being deleted for logging purposes.
// 		 */
// 		async deleteSession(sessionToken: string): Promise<void> {
// 			const deleteSession = new DeleteSessionStore();
// 			const data = (await deleteSession.mutate({ sessionToken: sessionToken }, { event })).data;
// 			const deletedSession = data?.deleteSession;
// 			console.log('deletedSession', deletedSession);

// 			if (deletedSession == null || deletedSession == false) {
// 			}
// 		},
// 		createVerificationToken(
// 			verificationToken: VerificationToken
// 		): Awaitable<VerificationToken | null | undefined> {
// 			throw new Error('Method not implemented.');
// 		},
// 		/**
// 		 * Return verification token from the database and delete it so it cannot be
// 		 * used again.
// 		 */
// 		useVerificationToken(params: {
// 			identifier: string;
// 			token: string;
// 		}): Awaitable<VerificationToken | null> {
// 			throw new Error('Method not implemented.');
// 		}
// 	};
// }
