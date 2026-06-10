import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Module,
} from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { CreateCommentDto, PaginationDto } from '@/dto';
import { JwtAuthGuard, RolesGuard } from '@/guards';
import { CurrentUser, Public, Roles } from '@/decorators';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async findByPost(postId: string, pagination: PaginationDto) {
    const { page = 1, limit = 5 } = pagination;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { postId },
        skip,
        take: limit,
        include: { author: { select: { id: true, email: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.comment.count({ where: { postId } }),
    ]);

    return { data: comments, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: CreateCommentDto, authorId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: dto.postId } });
    if (!post) throw new NotFoundException('Post not found');

    return this.prisma.comment.create({
      data: { content: dto.content, postId: dto.postId, authorId },
      include: { author: { select: { id: true, email: true, role: true } } },
    });
  }

  async remove(id: string, currentUser: any) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { post: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    // Permission logic:
    // - comment owner can delete their own comment
    // - post owner can delete any comment on their post
    // - moderator can delete any comment
    // - super_admin can delete any comment
    const canDelete =
      comment.authorId === currentUser.id ||
      comment.post.authorId === currentUser.id ||
      currentUser.role === 'MODERATOR' ||
      currentUser.role === 'SUPER_ADMIN';

    if (!canDelete) {
      throw new ForbiddenException('You do not have permission to delete this comment');
    }

    await this.prisma.comment.delete({ where: { id } });
    return { message: 'Comment deleted' };
  }
}

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Public()
  @Get('post/:postId')
  async findByPost(@Param('postId') postId: string, @Query() pagination: PaginationDto) {
    const data = await this.commentsService.findByPost(postId, pagination);
    return { statusCode: 200, data, message: 'Comments fetched', timestamp: new Date().toISOString() };
  }

  @Post()
  @Roles('REGULAR_USER', 'MODERATOR', 'SUPER_ADMIN')
  @UseGuards(RolesGuard)
  async create(@Body() dto: CreateCommentDto, @CurrentUser() user: any) {
    const data = await this.commentsService.create(dto, user.id);
    return { statusCode: 201, data, message: 'Comment created', timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.commentsService.remove(id, user);
    return { statusCode: 200, data, message: 'Comment deleted', timestamp: new Date().toISOString() };
  }
}

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, PrismaService],
})
export class CommentsModule {}
