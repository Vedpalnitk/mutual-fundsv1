import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const REQUIRED_PAGE_KEY = 'requiredPage';

/**
 * Decorator to mark a controller with the page path it belongs to.
 * Staff users must have this page in their allowedPages to access it.
 */
export const RequiredPage = (page: string) =>
  (target: any) => {
    Reflect.defineMetadata(REQUIRED_PAGE_KEY, page, target);
  };

@Injectable()
export class StaffPageGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPage = this.reflector.get<string>(
      REQUIRED_PAGE_KEY,
      context.getClass(),
    );

    // If no page requirement set, allow
    if (!requiredPage) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Non-staff users always pass through
    if (!user || user.role !== 'fa_staff') return true;

    // Staff must have the page in their allowedPages
    const allowedPages: string[] = user.allowedPages || [];
    if (!allowedPages.includes(requiredPage)) {
      throw new ForbiddenException('You do not have access to this page');
    }

    return true;
  }
}
