/**
 * 搜索参数解析和管理工具
 * 实现URL作为单一真相源的核心逻辑
 */

export interface SearchParams {
  where: string;
  checkIn: string;
  checkOut: string; 
  guests: number;
  category: string;
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * 解析URL搜索参数，提供默认值和校验
 * @param searchParams - Next.js searchParams 对象或 URLSearchParams
 * @returns 标准化的搜索参数对象
 */
export function parseSearchParams(searchParams: URLSearchParams | Record<string, string | string[]>): SearchParams {
  // 统一处理不同的输入格式
  const params = searchParams instanceof URLSearchParams 
    ? searchParams 
    : new URLSearchParams(Object.entries(searchParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]).filter(([_, value]) => value));

  return {
    where: params.get('where') || params.get('location') || '',
    checkIn: params.get('check-in') || '',
    checkOut: params.get('check-out') || '',
    guests: Math.max(1, parseInt(params.get('guests') || '1')),
    category: params.get('category') || '',
    page: parseInt(params.get('page') || '1'),
    limit: parseInt(params.get('limit') || '20'),
    offset: parseInt(params.get('offset') || '0')
  };
}

/**
 * 将搜索参数对象转换为URL查询字符串
 * 只包含非默认值的参数，保持URL简洁
 */
export function buildSearchQuery(params: Partial<SearchParams>): URLSearchParams {
  const query = new URLSearchParams();
  
  // 只添加非默认值的参数
  if (params.where && params.where.trim()) {
    query.set('location', params.where.trim());
  }
  
  if (params.checkIn) {
    query.set('check-in', params.checkIn);
  }
  
  if (params.checkOut) {
    query.set('check-out', params.checkOut);
  }
  
  if (params.guests && params.guests > 1) {
    query.set('guests', params.guests.toString());
  }
  
  if (params.category) {
    query.set('category', params.category);
  }
  
  if (params.page && params.page > 1) {
    query.set('page', params.page.toString());
  }
  
  if (params.limit && params.limit !== 20) {
    query.set('limit', params.limit.toString());
  }
  
  if (params.offset && params.offset > 0) {
    query.set('offset', params.offset.toString());
  }
  
  return query;
}

/**
 * 生成用于组件key的稳定字符串
 * URL参数变化时，组件会重新挂载
 */
export function getSearchKey(params: SearchParams): string {
  const keyParams = {
    where: params.where,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    guests: params.guests,
    category: params.category
  };
  
  return Object.entries(keyParams)
    .filter(([_, value]) => value && value !== '' && value !== 1)
    .map(([key, value]) => `${key}:${value}`)
    .join('|') || 'default';
}

/**
 * 验证搜索参数的有效性
 */
export function validateSearchParams(params: SearchParams): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (params.guests < 1) {
    errors.push('房客数必须至少为1');
  }
  
  if (params.guests > 20) {
    errors.push('房客数不能超过20');
  }
  
  // 日期验证
  if (params.checkIn && params.checkOut) {
    const checkInDate = new Date(params.checkIn);
    const checkOutDate = new Date(params.checkOut);
    
    if (checkInDate >= checkOutDate) {
      errors.push('退房日期必须晚于入住日期');
    }
    
    if (checkInDate < new Date()) {
      errors.push('入住日期不能早于今天');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 为API请求格式化参数
 */
export function formatApiParams(params: SearchParams): Record<string, string> {
  const apiParams: Record<string, string> = {};
  
  if (params.where) apiParams.location = params.where;
  if (params.checkIn) apiParams.check_in = params.checkIn;
  if (params.checkOut) apiParams.check_out = params.checkOut;
  if (params.guests > 1) apiParams.guests = params.guests.toString();
  if (params.category) apiParams.category = params.category;
  if (params.limit) apiParams.limit = params.limit.toString();
  if (params.offset) apiParams.offset = params.offset.toString();
  
  return apiParams;
}