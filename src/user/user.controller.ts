import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, Next, Res, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDTO } from 'src/auth/dto/login-auth.dto';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Res() res, @Req() req, @Next() next) {
    try {
      const userObject = req.user;
      const user = await this.userService.findUserById(userObject._id);
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        data: user,
        message: 'success',
      });
    } catch (error) {
      next(error);
    }
  }

  @Patch('/')
  @UseGuards(JwtAuthGuard)
  async update(@Res() res, @Req() req, @Next() next, @Body() updateUserDto: UpdateUserDto) {
    try {
      const userObject = req.user;
      const user = await this.userService.updateUserProfile(userObject._id, updateUserDto);
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        data: user,
        message: 'success',
      });
    } catch (error) {
      next(error);
    }
  }
}
