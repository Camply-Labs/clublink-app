import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { toObservable } from '@angular/core/rxjs-interop';
import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';
import { AppStatusService } from './core/services/app-status.service';
import { User } from './core/models';

jest.mock('@angular/core/rxjs-interop', () => ({
	toObservable: jest.fn(),
	toSignal: jest.fn((_source: unknown, options?: { initialValue?: string }) => signal(options?.initialValue ?? '')),
}));

describe('AppComponent', () => {
	const createComponent = () => TestBed.runInInjectionContext(() => new AppComponent());
	const toObservableMock = jest.mocked(toObservable);

	const createAuthMock = (user: User | null) => ({
		currentUser: signal(user),
		isLoading: signal(false),
	});

	const createRouterMock = (url: string) => {
		const navigate = jest.fn() as jest.MockedFunction<Router['navigate']>;
		navigate.mockResolvedValue(true);

		return {
			url,
			events: of(new NavigationEnd(1, url, url)),
			navigate,
		};
	};

	const createStatusMock = () => ({
		isLoading: signal(false),
		isBlocked: jest.fn(() => false),
	});

	beforeEach(() => {
		TestBed.resetTestingModule();
		toObservableMock.mockReset();
		toObservableMock.mockReturnValue(of(false));
	});

	it('redirects anonymous users to login when they are not already on login', () => {
		const router = createRouterMock('/');

		TestBed.configureTestingModule({
			providers: [
				{ provide: AuthService, useValue: createAuthMock(null) },
				{ provide: Router, useValue: router },
				{ provide: AppStatusService, useValue: createStatusMock() },
			],
		});

		const component = createComponent();

		component.ngOnInit();

		expect(router.navigate).toHaveBeenCalledWith(['/login']);
	});

	it('does not redirect anonymous users already on login', () => {
		const router = createRouterMock('/login');

		TestBed.configureTestingModule({
			providers: [
				{ provide: AuthService, useValue: createAuthMock(null) },
				{ provide: Router, useValue: router },
				{ provide: AppStatusService, useValue: createStatusMock() },
			],
		});

		const component = createComponent();

		component.ngOnInit();

		expect(router.navigate).not.toHaveBeenCalled();
	});

	it('redirects diretoria users from login to podium', () => {
		const router = createRouterMock('/login');
		const user = { role: 'diretoria' } as User;

		TestBed.configureTestingModule({
			providers: [
				{ provide: AuthService, useValue: createAuthMock(user) },
				{ provide: Router, useValue: router },
				{ provide: AppStatusService, useValue: createStatusMock() },
			],
		});

		const component = createComponent();

		component.ngOnInit();

		expect(router.navigate).toHaveBeenCalledWith(['/podium']);
	});

	it('redirects desbravador users from login to my points', () => {
		const router = createRouterMock('/login');
		const user = { role: 'desbravador' } as User;

		TestBed.configureTestingModule({
			providers: [
				{ provide: AuthService, useValue: createAuthMock(user) },
				{ provide: Router, useValue: router },
				{ provide: AppStatusService, useValue: createStatusMock() },
			],
		});

		const component = createComponent();

		component.ngOnInit();

		expect(router.navigate).toHaveBeenCalledWith(['/my-points']);
	});

	it('does not redirect authenticated users away from other routes', () => {
		const router = createRouterMock('/members');
		const user = { role: 'diretoria' } as User;

		TestBed.configureTestingModule({
			providers: [
				{ provide: AuthService, useValue: createAuthMock(user) },
				{ provide: Router, useValue: router },
				{ provide: AppStatusService, useValue: createStatusMock() },
			],
		});

		const component = createComponent();

		component.ngOnInit();

		expect(router.navigate).not.toHaveBeenCalled();
	});

	it('does not redirect users on override routes', () => {
		const router = createRouterMock('/admin-override');

		TestBed.configureTestingModule({
			providers: [
				{ provide: AuthService, useValue: createAuthMock(null) },
				{ provide: Router, useValue: router },
				{ provide: AppStatusService, useValue: createStatusMock() },
			],
		});

		const component = createComponent();

		component.ngOnInit();

		expect(router.navigate).not.toHaveBeenCalled();
	});
});
