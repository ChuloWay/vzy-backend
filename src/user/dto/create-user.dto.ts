import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'First Name is required' })
  @IsString()
  @Matches(/^[a-zA-Z]+$/, {
    message: 'First Name can only contain letters',
  })
  username: string;

  @IsNotEmpty()
  @IsEmail()
  @Matches(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/, {
    message: 'Invalid email format',
  })
  @Transform((params) => params.value.toLowerCase())
  email: string;

  @IsNotEmpty({ message: 'Phone Number is required' })
  @Matches(/^(?:\+234|234|0)(?:\d{10})$/, {
    message: 'Invalid phone number format',
  })
  phoneNumber: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,30}$/, {
    message: 'Invalid password format',
  })
  password: string;
}
