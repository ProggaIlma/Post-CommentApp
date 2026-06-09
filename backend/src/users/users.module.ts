import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  Module,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaginationDto } from '../dto';
import { JwtAuthGuard, RolesGuard } from '../guards';
import { CurrentUser, Roles } from '../decorators';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: { id: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return { data: users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async remove(id: string, currentUser: any) {
    if (currentUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only Super Admin can delete users');
    }
    if (currentUser.id === id) {
      throw new ForbiddenException('Cannot delete yourself');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted' };
  }
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('SUPER_ADMIN')
  async findAll(@Query() pagination: PaginationDto) {
    const data = await this.usersService.findAll(pagination);
    return { statusCode: 200, data, message: 'Users fetched', timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.usersService.remove(id, user);
    return { statusCode: 200, data, message: 'User deleted', timestamp: new Date().toISOString() };
  }
}

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
})
export class UsersModule {}
