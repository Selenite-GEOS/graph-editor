import type { Setup } from '$graph-editor/setup/Setup';
import { tick } from 'svelte';

export type NotificationParams = {
	title?: string;
	message?: string;
	color?: string;
	id?: string;
	autoClose?: boolean | number;
	withCloseButton?: boolean;
};
export type DisplayedNotification = {
	notif: NotificationParams;
	visible: boolean;
	remove: () => void;
};
export type NotificationsManager = {
	show: (params: NotificationParams) => void;
	success: (params: Omit<NotificationParams, 'color'>) => void;
	warn: (params: Omit<NotificationParams, 'color'>) => void;
	error: (params: Omit<NotificationParams, 'color'>) => void;
	info: (params: Omit<NotificationParams, 'color'>) => void;
	hide: (id: string) => void;
};

/**
 * This class is a singleton that manages a queue of notifications.
 */
class Notifications implements NotificationsManager {
	static #instance: Notifications;
	static get instance(): Notifications {
		if (!Notifications.#instance) {
			Notifications.#instance = new Notifications();
		}
		return Notifications.#instance;
	}

	queue: NotificationParams[] = $state([]);
	maxNotifs = $state(4);
	autoHideTime = $state(3000);
	hideAnimTime = $state(300);
	displayed: DisplayedNotification[] = $state([]);

	private constructor() {}

	hide(id: string) {
		const notif = this.displayed.filter((n) => n.notif.id === id).forEach((n) => n.remove());
		this.queue = this.queue.filter((n) => n.id !== id);
	}

	async show(notif: NotificationParams) {
		console.debug('showing notification with title:', notif.title, 'and message:', notif.message);
		this.queue.push(notif);
		await this.updateDisplayed();
	}

	success(notif: Omit<NotificationParams, 'color'>) {
		this.show({ ...notif, color: 'success' });
	}

	warn(notif: Omit<NotificationParams, 'color'>) {
		this.show({ ...notif, color: 'warning' });
	}

	error(notif: Omit<NotificationParams, 'color'>) {
		this.show({ ...notif, color: 'error' });
	}

	info(notif: Omit<NotificationParams, 'color'>) {
		this.show({ ...notif, color: 'info' });
	}

	removeDisplayed(notif: DisplayedNotification) {
		const i = this.displayed.findIndex((n) => n === notif);
		if (i !== -1) {
			this.displayed.splice(i, 1);
		}
		this.updateDisplayed();
	}

	updateDisplayed() {
		if (this.displayed.length < this.maxNotifs) {
			const notif = this.queue.shift();
			if (notif) {
				let hideTimeout: NodeJS.Timeout | undefined;
				let removeTimeout: NodeJS.Timeout | undefined;
				let hideTime = typeof notif.autoClose === 'number' ? notif.autoClose : this.autoHideTime;

				const displayedNotif: DisplayedNotification = $state({
					notif,
					visible: true,
					remove: () => {
						displayedNotif.remove = () => {
							console.debug('Already removing notif');
						};
						if (hideTimeout) clearTimeout(hideTimeout);
						if (removeTimeout) clearTimeout(removeTimeout);
						displayedNotif.visible = false;
						setTimeout(() => this.removeDisplayed(displayedNotif), hideTime);
					}
				});

				this.displayed.push(displayedNotif);
				// await tick();
				if (notif.autoClose !== false) {
					// Hide notif timeout
					hideTimeout = setTimeout(() => {
						displayedNotif.visible = false;
					}, hideTime - this.hideAnimTime);
					// Remove notif timeout
					removeTimeout = setTimeout(() => this.removeDisplayed(displayedNotif), hideTime);
				}
			}
		}
	}
}

export const notifications = Notifications.instance;

export const notificationsSetup: Setup = {
	name: 'notifications',
	setup: ({ factory }) => {
		factory.notifications = notifications;
	}
};
