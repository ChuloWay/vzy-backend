import { HttpException, HttpStatus, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LoginUserDTO } from './dto/login-auth.dto';
import { JwtAuthService } from './jwt.service';
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

  async createUser(createUserDTO: CreateUserDto) {
    const { email, phoneNumber } = createUserDTO;

    const checkEmail = await this.userService.findUserByEmail(email);
    if (checkEmail) {
      throw new HttpException('An account with this email address already exists.', HttpStatus.BAD_REQUEST);
    }
    const checkNumber = await this.userService.findUserByPhoneNumber(phoneNumber);
    if (checkNumber) {
      throw new HttpException('An account with this phoneNumber address already exists.', HttpStatus.BAD_REQUEST);
    }

    return await this.userService.create(createUserDTO);
  }

  async login(loginUserDTO: LoginUserDTO) {
    // Get user information
    const user = await this.userService.findUserByEmail(loginUserDTO.email);
    // Check if user exists
    if (!user) {
      throw new NotFoundException('Email does not exist');
    }

    const isValid = await this.utilityService.comparePassword(loginUserDTO.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { _id, email } = user;
    const data = { _id, email, appName: 'vzy' };

    delete user.password;

    const token = this.jwtAuthService.createToken(data);
    return { user, token };
  }
  findAll() {
    return 'This action returns all auth';
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
