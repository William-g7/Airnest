from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import os
import logging
from django.conf import settings
import requests
import uuid
import time

logger = logging.getLogger(__name__)

LANGUAGE_MAP = {
    'zh': 'zh-Hans',  # 简体中文
    'fr': 'fr',       # 法语
    'en': 'en',       # 英语
}

AZURE_TRANSLATOR_KEY = os.environ.get('AZURE_TRANSLATOR_KEY', getattr(settings, 'AZURE_TRANSLATOR_KEY', ''))
AZURE_TRANSLATOR_ENDPOINT = os.environ.get('AZURE_TRANSLATOR_ENDPOINT', getattr(settings, 'AZURE_TRANSLATOR_ENDPOINT', 'https://api.cognitive.microsofttranslator.com'))
AZURE_TRANSLATOR_LOCATION = os.environ.get('AZURE_TRANSLATOR_LOCATION', getattr(settings, 'AZURE_TRANSLATOR_LOCATION', 'eastasia')) 

def translate_with_azure(text, target_language, source_language='en'):
    """
    使用 Azure Translator API 进行翻译
    
    参数:
    - text: 要翻译的文本
    - target_language: 目标语言代码
    - source_language: 源语言代码 (可选，默认为'en')
    
    返回:
    - 翻译后的文本
    """
    start_time = time.time()
    
    if not AZURE_TRANSLATOR_KEY:
        logger.error("Azure Translator API密钥未配置")
        return text
    
    try:
        logger.info(f"尝试使用Azure API翻译文本(前50字符): '{text[:50]}...'")
        
        path = '/translate'
        constructed_url = AZURE_TRANSLATOR_ENDPOINT + path
        
        params = {
            'api-version': '3.0',
            'to': [target_language]
        }
        
        if source_language and source_language != 'auto':
            params['from'] = source_language
        
        headers = {
            'Ocp-Apim-Subscription-Key': AZURE_TRANSLATOR_KEY,
            'Ocp-Apim-Subscription-Region': AZURE_TRANSLATOR_LOCATION,
            'Content-type': 'application/json',
            'X-ClientTraceId': str(uuid.uuid4())
        }
        
        body = [{
            'text': text
        }]
        
        api_start_time = time.time()
        response = requests.post(constructed_url, params=params, headers=headers, json=body, timeout=30)
        api_duration = time.time() - api_start_time
        
        logger.info(f"Azure API请求完成，耗时: {api_duration:.2f}秒")

        ## Azure API返回的JSON格式
        #[
        #   {
        #     "translations": [
        #       {
        #         "text": "J'aimerais vraiment conduire votre voiture autour du pâté de maisons plusieurs fois!",
        #         "to": "fr"
        #       },
        #       {
        #         "text": "Ngingathanda ngempela ukushayela imoto yakho endaweni evimbelayo izikhathi ezimbalwa!",
        #         "to": "zu"
        #       }
        #     ]
        #   }
        # ]
        if response.status_code == 200:
            response_json = response.json()
            if response_json and len(response_json) > 0:
                translations = response_json[0].get('translations', [])
                if translations and len(translations) > 0:
                    translated_text = translations[0].get('text', '')
                    if translated_text:
                        logger.info(f"翻译成功: '{text[:30]}...' -> '{translated_text[:30]}...', 耗时: {time.time() - start_time:.2f}秒")
                        return translated_text
        
        # 如果响应不是200或没有找到翻译结果
        logger.warning(f"Azure API返回了非预期的响应: {response.status_code}, {response.text}")
        return text
        
    except Exception as e:
        # 详细记录失败原因和失败的文本
        total_time = time.time() - start_time
        logger.error(f"Azure翻译失败，耗时: {total_time:.2f}秒")
        logger.error(f"翻译失败的文本(完整文本): '{text}'")
        logger.error(f"翻译错误详情: {str(e)}")
        
        return text

def translate_batch_with_azure(texts, target_language, source_language='en'):
    """
    使用Azure Translator API批量翻译文本
    
    参数:
    - texts: 要翻译的文本列表
    - target_language: 目标语言代码
    - source_language: 源语言代码 (可选，默认为'en')
    
    返回:
    - 翻译结果字典，原文为键，翻译为值
    """
    start_time = time.time()
    
    if not AZURE_TRANSLATOR_KEY:
        logger.error("Azure Translator API密钥未配置")
        return {text: text for text in texts}
    
    # 空文本处理
    texts = [text for text in texts if text and text.strip()]
    if not texts:
        return {}
    
    results = {}
    
    try:
        logger.info(f"开始使用Azure API批量翻译 {len(texts)} 个文本，目标语言: {target_language}")
        
        path = '/translate'
        constructed_url = AZURE_TRANSLATOR_ENDPOINT + path
        
        params = {
            'api-version': '3.0',
            'to': [target_language]
        }
        
        if source_language and source_language != 'auto':
            params['from'] = source_language
        
        headers = {
            'Ocp-Apim-Subscription-Key': AZURE_TRANSLATOR_KEY,
            'Ocp-Apim-Subscription-Region': AZURE_TRANSLATOR_LOCATION,
            'Content-type': 'application/json',
            'X-ClientTraceId': str(uuid.uuid4())
        }
        
        # Azure API限制每批100个文本，所以需要分批处理
        batch_size = 100
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i+batch_size]
            
            # 构建请求体
            body = [{'text': text} for text in batch_texts]
            
            batch_start_time = time.time()
            logger.info(f"发送批次 {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1}，包含 {len(batch_texts)} 个文本")
            
            response = requests.post(constructed_url, params=params, headers=headers, json=body, timeout=60)
            
            batch_duration = time.time() - batch_start_time
            logger.info(f"批次API请求完成，耗时: {batch_duration:.2f}秒")
            
            if response.status_code == 200:
                response_json = response.json()
                
                # 处理每个文本的翻译结果
                for j, translation_result in enumerate(response_json):
                    original_text = batch_texts[j]
                    translations = translation_result.get('translations', [])
                    
                    if translations and len(translations) > 0:
                        translated_text = translations[0].get('text', '')
                        if translated_text:
                            results[original_text] = translated_text
                        else:
                            results[original_text] = original_text
                            logger.warning(f"文本未被成功翻译: '{original_text}'")
                    else:
                        results[original_text] = original_text
                        logger.warning(f"文本未被成功翻译: '{original_text}'")
            else:
                # 处理错误情况，为该批次的所有文本使用原文
                logger.error(f"批次翻译请求失败，状态码: {response.status_code}, 响应: {response.text}")
                for text in batch_texts:
                    results[text] = text
    
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
        
        mapped_language = LANGUAGE_MAP.get(target_language)
        
        if not mapped_language:
            logger.warning(f"不支持的语言代码: {target_language}")
            return JsonResponse({'translated_text': text, 'error': f"Unsupported language: {target_language}"})
        
        if not text or mapped_language == 'en':
            return JsonResponse({'translated_text': text})
        
        translated_text = text
        try:
            translated_text = translate_with_azure(text, mapped_language)
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
        
        mapped_language = LANGUAGE_MAP.get(target_language)
        
        if not mapped_language:
            logger.warning(f"不支持的语言代码: {target_language}")
            return JsonResponse({'translations': {text: text for text in texts}, 
                               'error': f"Unsupported language: {target_language}"})
        
        if not texts or mapped_language == 'en':
            return JsonResponse({'translations': {text: text for text in texts}})
        
        logger.info(f"收到批量翻译请求，共{len(texts)}个文本")
        
        translations = translate_batch_with_azure(texts, mapped_language)
        
        logger.info(f"批量翻译完成，共{len(texts)}个文本")
        
        return JsonResponse({'translations': translations})
        
    except json.JSONDecodeError:
        logger.error("请求体JSON格式无效")
        return JsonResponse({'error': 'Invalid JSON in request body'}, status=400)
    
    except Exception as e:
        logger.error(f"批量翻译错误: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)