import { browser } from '$app/environment';
import { HoudiniClient } from '$houdini';

export default new HoudiniClient({
	url: 'http://localhost:8000/api/v1/graphql',
	// uncomment this to configure the network call (for things like authentication)
	// for more information, please visit here: https://www.houdinigraphql.com/guides/authentication

	// fetchParams({ session }) {
	// 	// console.log('houdiniClient : fetchParams : session', session);
	// 	let sessionToken;
	// 	if (browser && typeof localStorage !== 'undefined')
	// 		sessionToken = localStorage.getItem('sessionToken')?.replaceAll('"', '');
	// 	else sessionToken = (session as unknown as { token: string })?.token;
	// 	// sessionToken = '05785ac6-25eb-4c1f-80a1-c6f6a96c8e45';
	// 	// console.log('houdiniClient : sessionToken', sessionToken);
	// 	return {
	// 		headers: {
	// 			Authorization: `Bearer ${sessionToken}`
	// 		}
	// 	};
	// }
});
