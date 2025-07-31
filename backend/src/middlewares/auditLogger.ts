import { Request, Response, NextFunction } from 'express';
import { logActivity } from '../utils/activityLogger';

const METHODS_TO_LOG = ['POST', 'PUT', 'PATCH', 'DELETE'];

export const auditLogger = async (req: Request, res: Response, next: NextFunction) => {
  // Chỉ log các method thay đổi dữ liệu
  if (!METHODS_TO_LOG.includes(req.method)) return next();

  // Bỏ qua các endpoint không cần thiết
  const skipEndpoints = [
    '/api/issues', // Bỏ qua log tự động cho issues - sẽ log thủ công trong controller
    '/api/tasks',  // Bỏ qua log tự động cho tasks - sẽ log thủ công trong controller
    '/api/documents', // Bỏ qua log tự động cho documents - sẽ log thủ công trong controller
    '/api/projects', // Bỏ qua log tự động cho projects - sẽ log thủ công trong controller
  ];
  
  const shouldSkip = skipEndpoints.some(endpoint => req.originalUrl.startsWith(endpoint));
  if (shouldSkip) return next();

  // Lưu lại thông tin gốc để log sau khi response
  const start = Date.now();
  const userId = req.user?.id;
  const method = req.method;
  const url = req.originalUrl;
  const objectType = url.split('/')[2] || url.split('/')[1] || 'unknown';
  const objectId = req.params.id || req.body.id || req.query.id || '';
  const description = `${method} ${url} | body: ${JSON.stringify(req.body)} | query: ${JSON.stringify(req.query)}`;

  // Đợi response xong mới log (để biết kết quả thành công/thất bại)
  res.on('finish', async () => {
    // Chỉ log nếu có userId (đã đăng nhập)
    if (userId) {
      await logActivity({
        userId,
        action: method.toLowerCase(),
        objectType,
        objectId,
        description: `${description} | status: ${res.statusCode} | time: ${Date.now() - start}ms`
        // Không truyền notify
      });
    }
  });

  next();
}; 