import { HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LoginUserDTO } from './dto/login-auth.dto';
import { JwtAuthService } from './jwt/jwt.service';
import { UserService } from 'src/user/user.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UtilityService } from 'src/utils/utilityService';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private jwtAuthService: JwtAuthService,
    private readonly utilityService: UtilityService,
  ) {}

  /**
   * A method to create a new user.
   *
   * @param {CreateUserDto} createUserDTO - the DTO containing user information
   * @return {Promise} a promise that resolves with the created user
   */
  async createUser(createUserDTO: CreateUserDto) {
    try {
      const { email, phoneNumber } = createUserDTO;

      // Check if email already exists
      const existingEmailUser = await this.userService.findUserByEmail(email);
      if (existingEmailUser) {
        throw new HttpException('An account with this email address already exists.', HttpStatus.BAD_REQUEST);
      }

      // Check if phone number already exists
      const existingPhoneNumberUser = await this.userService.findUserByPhoneNumber(phoneNumber);
      if (existingPhoneNumberUser) {
        throw new HttpException('An account with this phone number already exists.', HttpStatus.BAD_REQUEST);
      }

      return await this.userService.create(createUserDTO);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  /**
   * Perform user login and return user information and a token.
   *
   * @param {LoginUserDTO} loginUserDTO - the DTO containing user login information
   * @return {object} an object containing user information and a token
   */
  async login(loginUserDTO: LoginUserDTO) {
    try {
      // Get user information
      const user = await this.userService.findUserByEmail(loginUserDTO.email);

      // Check if user exists and compare passwords
      const isValid = await this.utilityService.comparePassword(loginUserDTO.password, user?.password || '');
      if (!user || !isValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const { _id, email } = user;

      // Create token
      const token = this.jwtAuthService.createToken({ _id, email });

      return { user, token };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
