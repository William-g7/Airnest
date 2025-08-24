from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import os
import logging
from django.conf import settings
import time
from google.cloud import translate_v3
from google.oauth2 import service_account

logger = logging.getLogger(__name__)

# 语言映射：项目语言代码 -> Google Translate 语言代码
LANGUAGE_MAP = {
    'zh': 'zh-cn',  # 简体中文
    'fr': 'fr',     # 法语
    'en': 'en',     # 英语
}

# Google Translate 配置
GOOGLE_CREDENTIALS_PATH = os.path.join(settings.BASE_DIR, 'google-credentials.json')
GOOGLE_PROJECT_ID = 'airnest-459809'

# 全局翻译客户端实例，用于缓存
_translate_client = None

def get_translate_client():
    """
    支持三种凭证来源：
    1) GCP_CREDENTIALS_JSON（完整 JSON 文本）
    2) GOOGLE_APPLICATION_CREDENTIALS（指向文件路径）
    3) 项目根目录 google-credentials.json（开发用）
    """
    global _translate_client
    if _translate_client:
        return _translate_client

    # 1) JSON 直接来自环境变量
    raw = os.getenv('GCP_CREDENTIALS_JSON')
    if raw:
        try:
            info = json.loads(raw)
            creds = service_account.Credentials.from_service_account_info(info)
            _translate_client = translate_v3.TranslationServiceClient(credentials=creds)
            logger.info('[i18n] using GCP_CREDENTIALS_JSON for Translate client')
            return _translate_client
        except Exception as e:
            logger.error(f'[i18n] invalid GCP_CREDENTIALS_JSON: {e}')

    # 2) 指向文件的标准变量
    json_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if json_path and os.path.exists(json_path):
        try:
            creds = service_account.Credentials.from_service_account_file(json_path)
            _translate_client = translate_v3.TranslationServiceClient(credentials=creds)
            logger.info('[i18n] using GOOGLE_APPLICATION_CREDENTIALS file for Translate client')
            return _translate_client
        except Exception as e:
            logger.error(f'[i18n] failed reading GOOGLE_APPLICATION_CREDENTIALS: {e}')

    # 3) 项目内文件（dev）
    local_path = os.path.join(settings.BASE_DIR, 'google-credentials.json')
    if os.path.exists(local_path):
        try:
            creds = service_account.Credentials.from_service_account_file(local_path)
            _translate_client = translate_v3.TranslationServiceClient(credentials=creds)
            logger.info('[i18n] using local google-credentials.json for Translate client')
            return _translate_client
        except Exception as e:
            logger.error(f'[i18n] failed reading local google-credentials.json: {e}')

    logger.error('[i18n] no valid Google credentials found')
    return None


def translate_with_google(text, target_language, source_language='en'):
    """
    使用 Google Translate v3 API 进行翻译
    
    参数:
    - text: 要翻译的文本
    - target_language: 目标语言代码
    - source_language: 源语言代码 (可选，默认为'en')
    
    返回:
    - 翻译后的文本
    """
    start_time = time.time()
    
    try:
        logger.info(f"尝试使用Google Translate v3 API翻译文本(前50字符): '{text[:50]}...'")
        
        # 获取翻译客户端
        client = get_translate_client()
        if not client:
            logger.error("无法创建Google Translate v3客户端")
            return text
        
        # 构建项目路径
        parent = f"projects/{GOOGLE_PROJECT_ID}/locations/global"
        
        # 执行翻译
        api_start_time = time.time()
        request = translate_v3.TranslateTextRequest({
            "parent": parent,
            "contents": [text],
            "mime_type": "text/plain",
            "source_language_code": source_language if source_language != 'auto' else None,
            "target_language_code": target_language,
        })
        
        response = client.translate_text(request=request)
        api_duration = time.time() - api_start_time
        
        logger.info(f"Google Translate v3 API请求完成，耗时: {api_duration:.2f}秒")
        
        if response.translations:
            translated_text = response.translations[0].translated_text
            total_time = time.time() - start_time
            logger.info(f"翻译成功: '{text[:30]}...' -> '{translated_text[:30]}...', 耗时: {total_time:.2f}秒")
            return translated_text
        else:
            logger.warning(f"Google Translate v3 API返回了无效的响应: {response}")
            return text
            
    except Exception as e:
        total_time = time.time() - start_time
        logger.error(f"Google Translate v3翻译失败，耗时: {total_time:.2f}秒")
        logger.error(f"翻译失败的文本: '{text}'")
        logger.error(f"翻译错误详情: {str(e)}")
        return text

def translate_batch_with_google(texts, target_language, source_language='en'):
    """
    使用Google Translate v3 API批量翻译文本
    
    参数:
    - texts: 要翻译的文本列表
    - target_language: 目标语言代码
    - source_language: 源语言代码 (可选，默认为'en')
    
    返回:
    - 翻译结果字典，原文为键，翻译为值
    """
    start_time = time.time()
    
    # 空文本处理
    texts = [text for text in texts if text and text.strip()]
    if not texts:
        return {}
    
    results = {}
    
    try:
        logger.info(f"开始使用Google Translate v3 API批量翻译 {len(texts)} 个文本，目标语言: {target_language}")
        
        # 获取翻译客户端
        client = get_translate_client()
        if not client:
            logger.error("无法创建Google Translate v3客户端")
            return {text: text for text in texts}
        
        # 构建项目路径
        parent = f"projects/{GOOGLE_PROJECT_ID}/locations/global"
        
        # Google Translate v3 API支持批量翻译，每批最多100个文本
        batch_size = 100
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i+batch_size]
            
            batch_start_time = time.time()
            logger.info(f"发送批次 {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}，包含 {len(batch_texts)} 个文本")
            
            # 执行批量翻译
            request = translate_v3.TranslateTextRequest({
                "parent": parent,
                "contents": batch_texts,
                "mime_type": "text/plain",
                "source_language_code": source_language if source_language != 'auto' else None,
                "target_language_code": target_language,
            })
            
            response = client.translate_text(request=request)
            batch_duration = time.time() - batch_start_time
            logger.info(f"批次API请求完成，耗时: {batch_duration:.2f}秒")
            
            # 处理批量翻译结果
            if response.translations:
                for j, translation in enumerate(response.translations):
                    if j < len(batch_texts):
                        original_text = batch_texts[j]
                        translated_text = translation.translated_text
                        results[original_text] = translated_text
                    else:
                        logger.warning(f"翻译结果数量与原文数量不匹配")
            else:
                # 如果没有翻译结果，返回原文
                for text in batch_texts:
                    results[text] = text
                    logger.warning(f"文本未被成功翻译: '{text}'")
    
    except Exception as e:
        logger.error(f"批量翻译处理失败: {str(e)}")
        # 返回还没翻译的文本的原文
        for text in texts:
            if text not in results:
                results[text] = text
    
    end_time = time.time()
    total_time = end_time - start_time
    success_count = sum(1 for k, v in results.items() if k != v)
    logger.info(f"批量翻译全部完成，总耗时: {total_time:.2f}秒，成功: {success_count}/{len(texts)}，失败: {len(texts) - success_count}/{len(texts)}")
    
    return results

@csrf_exempt
def translate_text(request):
    """
    翻译文本API端点
    POST 请求参数:
    - text: 要翻译的文本
    - target_language: 目标语言代码 (如 'zh', 'fr')
    
    返回:
    - translated_text: 翻译后的文本
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)
    
    try:
        data = json.loads(request.body)
        text = data.get('text', '')
        target_language = data.get('target_language', 'en')
        
        # 映射语言代码
        mapped_language = LANGUAGE_MAP.get(target_language)
        
        if not mapped_language:
            logger.warning(f"不支持的语言代码: {target_language}")
            return JsonResponse({'translated_text': text, 'error': f"Unsupported language: {target_language}"})
        
        # 如果目标语言是英文，直接返回原文
        if not text or mapped_language == 'en':
            return JsonResponse({'translated_text': text})
        
        translated_text = text
        try:
            translated_text = translate_with_google(text, mapped_language)
        except Exception as e:
            logger.error(f"翻译错误: {str(e)}")

        return JsonResponse({
            'translated_text': translated_text,
            'source_language': 'auto',
            'target_language': mapped_language
        })
        
    except json.JSONDecodeError:
        logger.error("请求体JSON格式无效")
        return JsonResponse({'error': 'Invalid JSON in request body'}, status=400)
    
    except Exception as e:
        logger.error(f"翻译过程发生错误: {str(e)}")
        return JsonResponse({
            'translated_text': text if 'text' in locals() else '',
            'error': str(e)
        }, status=500)

@csrf_exempt
def translate_batch(request):
    """
    批量翻译API端点
    POST 请求参数:
    - texts: 要翻译的文本列表
    - target_language: 目标语言代码 (如 'zh', 'fr')
    
    返回:
    - translations: 翻译结果字典，原文为键，翻译为值
    """
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST method is allowed'}, status=405)
    
    try:
        data = json.loads(request.body)
        texts = data.get('texts', [])
        target_language = data.get('target_language', 'en')
        
        # 映射语言代码
        mapped_language = LANGUAGE_MAP.get(target_language)
        
        if not mapped_language:
            logger.warning(f"不支持的语言代码: {target_language}")
            return JsonResponse({'translations': {text: text for text in texts}, 
                               'error': f"Unsupported language: {target_language}"})
        
        # 如果目标语言是英文，直接返回原文
        if not texts or mapped_language == 'en':
            return JsonResponse({'translations': {text: text for text in texts}})
        
        logger.info(f"收到批量翻译请求，共{len(texts)}个文本")
        
        translations = translate_batch_with_google(texts, mapped_language)
        
        logger.info(f"批量翻译完成，共{len(texts)}个文本")
        
        return JsonResponse({'translations': translations})
        
    except json.JSONDecodeError:
        logger.error("请求体JSON格式无效")
        return JsonResponse({'error': 'Invalid JSON in request body'}, status=400)
    
    except Exception as e:
        logger.error(f"批量翻译错误: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)