import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserStatus } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  /**
   * Creates a new user using the provided user data.
   *
   * @param {CreateUserDto} createUserDto - the data for creating the new user
   * @return {Promise<User>} a promise that resolves to the created user
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  /**
   * Finds a user by ID.
   *
   * @param {string} id - the ID of the user to find
   * @return {Promise<User | null>} a promise that resolves to the found user or null if not found
   */
  async findUserById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  /**
   * Finds a user by email.
   *
   * @param {string} email - the email of the user to find
   * @return {Promise<User | null>} a promise that resolves to the found user or null if not found
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  /**
   * Finds a user by phone number.
   *
   * @param {string} phoneNumber - the phone number of the user to find
   * @return {Promise<User | null>} a promise that resolves to the found user or null if not found
   */
  async findUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.userModel.findOne({ phoneNumber }).exec();
  }

  /**
   * Finds all users.
   *
   * @return {Promise<User[]>} a promise that resolves to an array of all users
   */
  async findAllUsers(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  /**
   * Updates the username or phone number of a user.
   *
   * @param {string} id - the ID of the user to update
   * @param {UpdateUserDto} updateUserDto - the data for updating the user
   * @return {Promise<User | null>} a promise that resolves to the updated user or null if not found
   */

  async updateUserProfile(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    try {
      const { username, phoneNumber } = updateUserDto;
      const existingUser = await this.userModel.findById(id);
      if (!existingUser) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const query = {
        $or: [{ username: username ?? existingUser.username }, { phoneNumber: phoneNumber ?? existingUser.phoneNumber }],
        _id: { $ne: id },
      };

      // Check for a user with conflicting username or phone number
      const conflictingUser = await this.userModel.findOne(query);
      if (conflictingUser) {
        if (conflictingUser.username === username) {
          throw new HttpException('Another user already has that username', HttpStatus.BAD_REQUEST);
        } else if (conflictingUser.phoneNumber === phoneNumber) {
          throw new HttpException('Another user already has that phone number', HttpStatus.BAD_REQUEST);
        }
      }

      const updateFields: Partial<User> = {};
      if (username !== null && existingUser.username !== username) {
        updateFields.username = username;
      }
      if (phoneNumber !== undefined && existingUser.phoneNumber !== phoneNumber) {
        updateFields.phoneNumber = phoneNumber;
      }

      const updatedUser = await this.userModel.findByIdAndUpdate(id, updateFields, { new: true });

      if (!updatedUser) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      return updatedUser;
    } catch (error) {
      console.error('An error occurred while updating the user:', error);
      throw error;
    }
  }
  async updateUserStatus(userId: string, session: any): Promise<void> {
    try {
      // Find the user by ID within the transaction session
      const user = await this.userModel.findById(userId, session);
      if (!user) {
        throw new Error('User not found');
      }

      // Update the status field
      user.status = UserStatus.PAID;

      // Save the updated user within the transaction session
      await user.save({ session });
    } catch (error) {
      console.error('Error updating user status:', error);
      throw new HttpException('Failed to update user status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
