from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from googletrans import Translator
import logging

# 设置日志记录器
logger = logging.getLogger(__name__)

# 语言代码映射表 - 将前端语言代码映射到googletrans支持的语言代码
LANGUAGE_MAP = {
    'zh': 'zh-cn',  # 简体中文
    'fr': 'fr',     # 法语
    'en': 'en',     # 英语
    # 可以根据需要添加更多映射
}

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
        
        # 将前端语言代码映射到googletrans支持的格式
        mapped_language = LANGUAGE_MAP.get(target_language)
        
        # 如果没有映射，记录警告并返回原文
        if not mapped_language:
            logger.warning(f"Unsupported language code: {target_language}")
            return JsonResponse({'translated_text': text, 'error': f"Unsupported language: {target_language}"})
        
        # 空文本或目标语言是英语，则直接返回原文
        if not text or mapped_language == 'en':
            return JsonResponse({'translated_text': text})
        
        # 创建翻译器实例并指定服务URL以提高可靠性
        translator = Translator(service_urls=['translate.google.com', 'translate.google.co.kr'])
        
        # 执行翻译
        translation = translator.translate(text, dest=mapped_language)
        
        # 记录成功信息
        logger.info(f"Translated text from '{translation.src}' to '{mapped_language}'")
        
        # 返回翻译结果
        return JsonResponse({
            'translated_text': translation.text,
            'source_language': translation.src,
            'target_language': mapped_language
        })
        
    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body")
        return JsonResponse({'error': 'Invalid JSON in request body'}, status=400)
    
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        # 出错时返回原文和错误信息
        return JsonResponse({
            'translated_text': text if 'text' in locals() else '',
            'error': str(e)
        }, status=500)

@csrf_exempt
def translate_batch(request):
    """
    批量翻译文本API端点
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
        
        # 将前端语言代码映射到googletrans支持的格式
        mapped_language = LANGUAGE_MAP.get(target_language)
        
        # 如果没有映射，记录警告并返回原文
        if not mapped_language:
            logger.warning(f"Unsupported language code: {target_language}")
            return JsonResponse({'translations': {text: text for text in texts}, 
                               'error': f"Unsupported language: {target_language}"})
        
        # 空列表或目标语言是英语，则直接返回原文
        if not texts or mapped_language == 'en':
            return JsonResponse({'translations': {text: text for text in texts}})
        
        # 创建翻译器实例并指定服务URL以提高可靠性
        translator = Translator(service_urls=['translate.google.com', 'translate.google.co.kr'])
        
        # 存储翻译结果的字典
        translations = {}
        
        # 批量翻译
        for text in texts:
            if text:
                try:
                    translation = translator.translate(text, dest=mapped_language)
                    translations[text] = translation.text
                except Exception as e:
                    logger.error(f"Error translating text '{text}': {str(e)}")
                    translations[text] = text  # 出错时使用原文
            else:
                translations[text] = ''
        
        # 记录成功信息
        logger.info(f"Batch translated {len(texts)} texts to '{mapped_language}'")
        
        # 返回所有翻译结果
        return JsonResponse({'translations': translations})
        
    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body")
        return JsonResponse({'error': 'Invalid JSON in request body'}, status=400)
    
    except Exception as e:
        logger.error(f"Batch translation error: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500) 