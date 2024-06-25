let backendAddress = 'http://localhost:8000';

export function setBackendAddress(address: string): void {
	backendAddress = address;
}

export function getBackendAddress(): string {
	return backendAddress;
}
