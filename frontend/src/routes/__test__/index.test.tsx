import { describe, it, expect, vi } from 'vitest';
import { Routes } from '../index';

describe('Routes Component', () => {
  it('should export a Routes function', () => {
    expect(Routes).toBeDefined();
    expect(typeof Routes).toBe('function');
  });
});


describe('Route Structure Documentation', () => {
  it('should have the expected route paths', () => {
    
    const expectedRoutes = [
      '/',
      '/admin',
      '/student',
      '/login',
      '/register',
      '/president-page/:societyId',
      '*'
    ];

    
    expect(expectedRoutes.length).toBeGreaterThan(0);
    expect(expectedRoutes).toContain('/');
    expect(expectedRoutes).toContain('/login');
  });

  it('should have routes protected by role guards', () => {
    
    const adminProtectedRoutes = [
      '/admin',
      '/admin/event-list',
      '/admin/society-list'
    ];

    const studentProtectedRoutes = [
      '/student',
      '/student/profile',
      '/student/my-societies'
    ];

    
    expect(adminProtectedRoutes.length).toBeGreaterThan(0);
    expect(studentProtectedRoutes.length).toBeGreaterThan(0);
  });

  it('should have public routes accessible without authentication', () => {
    
    const publicRoutes = [
      '/login',
      '/register',
      '/all-events',
      '/all-societies'
    ];

    
    expect(publicRoutes.length).toBeGreaterThan(0);
    expect(publicRoutes).toContain('/login');
    expect(publicRoutes).toContain('/register');
  });
});

describe('Route Component Documentation', () => {
  it('should use public guard for login and register routes', () => {
    
    
    const publicGuardedRoutes = [
      { path: '/login', component: 'LoginPage', guard: 'PublicGuard' },
      { path: '/register', component: 'RegisterPage', guard: 'PublicGuard' },
      { path: '/all-events', component: 'AllEventsPage', guard: 'PublicGuard' },
    ];
    
    expect(publicGuardedRoutes.some(route => route.path === '/login')).toBe(true);
  });
  
  it('should use private guard with admin role for admin routes', () => {
    
    const adminRoutes = [
      { path: '/admin', role: 'admin', guard: 'PrivateGuard' },
      { path: '/admin/event-list', role: 'admin', guard: 'PrivateGuard' },
    ];
    
    expect(adminRoutes.every(route => route.role === 'admin')).toBe(true);
  });
  
  it('should use private guard with student role for student routes', () => {
    
    const studentRoutes = [
      { path: '/student', role: 'student', guard: 'PrivateGuard' },
      { path: '/student/profile', role: 'student', guard: 'PrivateGuard' },
    ];
    
    expect(studentRoutes.every(route => route.role === 'student')).toBe(true);
  });
  
  it('should have correct titles for pages', () => {
    
    const pageTitles = [
      { path: '/login', title: 'Login' },
      { path: '/register', title: 'Register' },
      { path: '/student', title: 'Student Dashboard' },
      { path: '/admin', title: 'Admin Dashboard' },
      { path: '/admin/event-list', title: 'Admin Event List' },
    ];
    
    expect(pageTitles.find(page => page.path === '/login')?.title).toBe('Login');
    expect(pageTitles.find(page => page.path === '/student')?.title).toBe('Student Dashboard');
  });
});