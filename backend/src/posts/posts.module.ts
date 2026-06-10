import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Module,
} from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { CreatePostDto, UpdatePostDto, PaginationDto } from '@/dto';
import { JwtAuthGuard, RolesGuard } from '@/guards';
import { CurrentUser, Public, Roles } from '@/decorators';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        skip,
        take: limit,
        include: {
          author: { select: { id: true, email: true, role: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.post.count(),
    ]);

    return { data: posts, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { author: { select: { id: true, email: true, role: true } } },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async create(dto: CreatePostDto, authorId: string) {
    return this.prisma.post.create({
      data: { ...dto, authorId },
      include: { author: { select: { id: true, email: true, role: true } } },
    });
  }

  async update(id: string, dto: UpdatePostDto, currentUser: any) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');

    if (post.authorId !== currentUser.id) {
      throw new ForbiddenException('You can only update your own posts');
    }

    return this.prisma.post.update({
      where: { id },
      data: dto,
      include: { author: { select: { id: true, email: true, role: true } } },
    });
  }

  async remove(id: string, currentUser: any) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');

    const canDelete =
      post.authorId === currentUser.id ||
      currentUser.role === 'MODERATOR' ||
      currentUser.role === 'SUPER_ADMIN';

    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this post');
    }

    await this.prisma.post.delete({ where: { id } });
    return { message: 'Post deleted' };
  }
}

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Public()
  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    const data = await this.postsService.findAll(pagination);
    return { statusCode: 200, data, message: 'Posts fetched', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.postsService.findOne(id);
    return { statusCode: 200, data, message: 'Post fetched', timestamp: new Date().toISOString() };
  }

  @Post()
  @Roles('REGULAR_USER', 'MODERATOR', 'SUPER_ADMIN')
  @UseGuards(RolesGuard)
  async create(@Body() dto: CreatePostDto, @CurrentUser() user: any) {
    const data = await this.postsService.create(dto, user.id);
    return { statusCode: 201, data, message: 'Post created', timestamp: new Date().toISOString() };
  }

  @Put(':id')
  @Roles('REGULAR_USER', 'MODERATOR', 'SUPER_ADMIN')
  @UseGuards(RolesGuard)
  async update(@Param('id') id: string, @Body() dto: UpdatePostDto, @CurrentUser() user: any) {
    const data = await this.postsService.update(id, dto, user);
    return { statusCode: 200, data, message: 'Post updated', timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.postsService.remove(id, user);
    return { statusCode: 200, data, message: 'Post deleted', timestamp: new Date().toISOString() };
  }
}

@Module({
  controllers: [PostsController],
  providers: [PostsService, PrismaService],
})
export class PostsModule {}
