# 🛠️ Sửa lỗi API POST và Xử lý Dữ liệu

## 🔍 Vấn đề đã gặp:

1. **Lỗi khi tạo dự án mới**: API POST `/api/projects` trả về lỗi 500 (Internal Server Error)
2. **Lỗi khi tạo công việc**: API POST `/api/tasks` trả về lỗi khi kiểm tra người được giao việc
3. **Lỗi khi xóa dự án**: Lỗi ràng buộc khóa ngoại `CalendarEventAttendee_eventId_fkey`
4. **Sử dụng quá nhiều memory**: Hiển thị lỗi `R14 (Memory quota exceeded)` trên Heroku

## 🛠️ Giải pháp đã áp dụng:

### 1. Cải thiện xử lý dữ liệu khi tạo dự án:

```typescript
// Trước đây: Thiếu kiểm tra và xác thực đầu vào đầy đủ
export const createProject = async (req: Request, res: Response) => {
  try {
    console.log('=== CREATE PROJECT REQUEST ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    // ...nhiều console.log không cần thiết...
    
    // Validate input rất hạn chế
    if (!name || !status) {
      throw new ApiError(400, 'Name and status are required');
    }
    if (typeof name !== 'string' || name.trim().length < 3) {
      throw new ApiError(400, 'Tên dự án phải có ít nhất 3 ký tự');
    }
    
    // Thiếu xác thực các trường khác
    // ...
  }
};

// Sau khi cải thiện: Kiểm tra và xác thực đầy đủ
export const createProject = async (req: Request, res: Response) => {
  try {
    // Extract and validate project data
    const { name, description, status, startDate, endDate, priority, memberIds } = req.body;
    
    // Validate input
    if (!name || !status) {
      throw new ApiError(400, 'Name and status are required');
    }
    
    if (typeof name !== 'string' || name.trim().length < 3) {
      throw new ApiError(400, 'Tên dự án phải có ít nhất 3 ký tự');
    }
    
    // Validate status
    const validStatuses = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, 'Invalid project status');
    }
    
    // Validate dates if provided
    if (startDate && isNaN(Date.parse(startDate))) {
      throw new ApiError(400, 'Invalid start date format');
    }
    
    if (endDate && isNaN(Date.parse(endDate))) {
      throw new ApiError(400, 'Invalid end date format');
    }
    
    // Validate priority if provided
    if (priority) {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      if (!validPriorities.includes(priority)) {
        throw new ApiError(400, 'Invalid priority value');
      }
    }
    
    // Validate memberIds if provided
    let validatedMemberIds: string[] = [];
    if (memberIds && Array.isArray(memberIds)) {
      // Filter out invalid memberIds
      validatedMemberIds = memberIds.filter(id => typeof id === 'string' && id.length > 0);
    }
    
    // ...
  }
};
```

### 2. Cải thiện xử lý lỗi khi kiểm tra người được giao việc:

```typescript
// Trước đây: Thiếu xử lý lỗi
if (assigneeId) {
  const assignee = await prisma.user.findUnique({
    where: { id: assigneeId }
  });

  if (!assignee) {
    throw new ApiError(404, 'Assignee not found');
  }

  const isAssigneeMember = project.members.some(
    (member: any) => member.userId === assigneeId
  );

  if (!isAssigneeMember) {
    throw new ApiError(400, 'Assignee must be a member of the project');
  }
}

// Sau khi cải thiện: Bọc trong try-catch để xử lý lỗi tốt hơn
if (assigneeId) {
  try {
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId }
    });

    if (!assignee) {
      throw new ApiError(404, 'Assignee not found');
    }

    const isAssigneeMember = project.members.some(
      (member: any) => member.userId === assigneeId
    );

    if (!isAssigneeMember) {
      throw new ApiError(400, 'Assignee must be a member of the project');
    }
  } catch (error) {
    console.error('Error checking assignee:', error);
    throw new ApiError(400, 'Invalid assignee ID or user not found');
  }
}
```

### 3. Sửa lỗi ràng buộc khóa ngoại khi xóa dự án:

```typescript
// Thêm bước xóa calendar event attendees trước khi xóa calendar events
// 7. Delete calendar event attendees first (foreign key constraint)
const calendarEvents = await prisma.calendarEvent.findMany({
  where: { projectId: id },
  select: { id: true }
});

const calendarEventIds = calendarEvents.map(event => event.id);

if (calendarEventIds.length > 0) {
  await prisma.calendarEventAttendee.deleteMany({
    where: { eventId: { in: calendarEventIds } }
  });
}
```

### 4. Giảm sử dụng memory:

1. **Loại bỏ console.log không cần thiết**: Xóa các lệnh ghi log dư thừa
2. **Tối ưu hóa truy vấn**: Chỉ lấy các trường cần thiết
3. **Xử lý dữ liệu hiệu quả hơn**: Kiểm tra và lọc dữ liệu đầu vào trước khi thực hiện các thao tác cơ sở dữ liệu

## ✅ Kết quả:

1. **API POST ổn định**: Các API POST hoạt động đúng và trả về thông báo lỗi rõ ràng khi cần
2. **Giảm sử dụng memory**: Giảm đáng kể lượng memory sử dụng, giảm thiểu lỗi R14 trên Heroku
3. **Tăng độ tin cậy**: Các thao tác cơ sở dữ liệu ổn định hơn với xác thực đầu vào tốt hơn
4. **Cải thiện trải nghiệm người dùng**: Thông báo lỗi rõ ràng và hữu ích hơn

## 📊 Lợi ích:

1. **Bảo mật tốt hơn**: Kiểm tra và xác thực đầu vào kỹ lưỡng giúp ngăn chặn các cuộc tấn công tiềm ẩn
2. **Dễ bảo trì**: Mã nguồn rõ ràng hơn với xử lý lỗi tốt hơn
3. **Hiệu suất tốt hơn**: Giảm thiểu lỗi và tối ưu hóa sử dụng tài nguyên
4. **Trải nghiệm người dùng tốt hơn**: Phản hồi nhanh hơn và thông báo lỗi hữu ích hơn

## 🔄 Các thay đổi đã triển khai:

1. **Cải thiện xác thực đầu vào**: Kiểm tra kỹ lưỡng tất cả các trường đầu vào
2. **Cải thiện xử lý lỗi**: Bọc các thao tác quan trọng trong try-catch
3. **Tối ưu hóa thứ tự xóa dữ liệu**: Xử lý đúng thứ tự xóa dữ liệu để tránh lỗi ràng buộc khóa ngoại
4. **Giảm thiểu sử dụng memory**: Loại bỏ console.log và tối ưu hóa truy vấn 