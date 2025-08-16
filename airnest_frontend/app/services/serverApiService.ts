// 服务器端专用API服务，用于在服务器组件中获取数据

import { PropertyType } from '../constants/propertyType';

/**
 * 从服务器端获取属性数据
 * 这个函数只能在服务器组件中使用
 */
export async function getProperties(
  params: Record<string, string> = {},
  endpoint: string = '/api/properties/with-reviews/'
): Promise<PropertyType[]> {
  try {
    // 构建查询字符串
    const queryParams = new URLSearchParams(params);
    const queryString = queryParams.toString();
    const apiUrl = `${process.env.API_URL || process.env.NEXT_PUBLIC_API_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Accept-Language': 'en', // 默认英文，标签会根据语言返回相应名称
      },
      // 开发模式下不缓存，生产环境下5分钟重新验证
      cache: 'no-store', // 开发时总是获取最新数据
      // next: { revalidate: 300 }, // 生产环境下可以启用5分钟缓存
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Server API fetch error:', error);
    // 返回空数组而不是抛出错误，这样页面至少可以渲染
    return [];
  }
}

/**
 * 获取属性详情
 */
export async function getPropertyById(id: string): Promise<PropertyType | null> {
  try {
    const apiUrl = `${process.env.API_URL || process.env.NEXT_PUBLIC_API_URL}/api/properties/${id}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'force-cache',
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch property ${id}:`, error);
    return null;
  }
} 