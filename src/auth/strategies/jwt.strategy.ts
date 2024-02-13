import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: `${process.env.PRIVATE_KEY.replace(/\\\\n/gm, '\\n')}`,
      algorithms: ['RS256'],
    });
  }


   /**
   * @description Validate the token and return the user
   * @param payload string
   * @returns User
   */
   public async validate(payload: any): Promise<any> {
    let user: User;

    if (payload) {
      user = await this.userService.findUserByEmail(payload.email);
    }

    if (!user) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }

    console.log("user here", user)

    return user;
  }
}
