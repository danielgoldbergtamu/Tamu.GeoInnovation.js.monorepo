import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
  Logger
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PermissionsMatchType } from '../../decorators/permissions.decorator';

/**
 * A 403 that says which permission the account lacks (#3038), in `message` and as `permissions`, so a page can name it.
 * On 15 November 2026 a dashboard answered every admin 403 because its permission had never been defined in Auth0, and
 * nothing in the answer said which. With 'some', any one of `permissions` would do; with 'all', each is needed.
 */
function missing(required: Array<string>, matchType: PermissionsMatchType, held: Array<string>): ForbiddenException {
  const lacking = matchType === 'all' ? required.filter((p) => !held.includes(p)) : required;
  const message =
    lacking.length === 1
      ? `This needs the ${lacking[0]} permission.`
      : matchType === 'all'
        ? `This needs these permissions: ${lacking.join(', ')}.`
        : `This needs one of these permissions: ${lacking.join(', ')}.`;

  return new ForbiddenException({ statusCode: 403, error: 'Forbidden', message, permissions: lacking });
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const decoratorArgs = this.reflector.get<[string[], PermissionsMatchType]>('Permissions', context.getHandler());

    // If the decorator is not present, default to denying the request.
    if (decoratorArgs === undefined) {
      Logger.warn('Using permissions guard but no decorator found. Denying request.', context.getClass().name);
      throw new UnauthorizedException();
    }

    const [requiredPermissions, matchType] = decoratorArgs;

    if (requiredPermissions && requiredPermissions.length === 0) {
      Logger.warn('Required permissions length is 0. Granting request.', context.getClass().name);
      return true;
    }

    const request = context.switchToHttp().getRequest();

    if (request.user === undefined) {
      throw new UnauthorizedException();
    }

    if (request.user.permissions === undefined) {
      throw missing(requiredPermissions, matchType, []);
    }

    const permissions = request.user.permissions;
    let ret: boolean;

    if (matchType === 'all') {
      ret = this._testMatchAll(permissions, requiredPermissions);
    } else {
      ret = this._testMatchSome(permissions, requiredPermissions);
    }

    if (ret === false) {
      throw missing(requiredPermissions, matchType, permissions);
    }

    return true;
  }

  private _testMatchAll(permissions: Array<string>, requiredPermissions: Array<string>): boolean {
    return requiredPermissions.every((rp) => {
      return permissions.includes(rp);
    });
  }

  private _testMatchSome(permissions: Array<string>, requiredPermissions: Array<string>): boolean {
    return requiredPermissions.some((rp) => {
      return permissions.includes(rp);
    });
  }
}
