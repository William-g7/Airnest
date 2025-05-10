from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from googletrans import Translator
import logging

logger = logging.getLogger(__name__)

# 语言代码映射表
LANGUAGE_MAP = {
    'zh': 'zh-cn', 
    'fr': 'fr',     
    'en': 'en',    
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
        
        mapped_language = LANGUAGE_MAP.get(target_language)
        
        if not mapped_language:
            logger.warning(f"Unsupported language code: {target_language}")
            return JsonResponse({'translated_text': text, 'error': f"Unsupported language: {target_language}"})
        
        if not text or mapped_language == 'en':
            return JsonResponse({'translated_text': text})
        
        translator = Translator(service_urls=['translate.google.com', 'translate.google.co.kr'])
        
        translation = translator.translate(text, dest=mapped_language)
        
        logger.info(f"Translated text from '{translation.src}' to '{mapped_language}'")
        
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
        
        mapped_language = LANGUAGE_MAP.get(target_language)
        
        if not mapped_language:
            logger.warning(f"Unsupported language code: {target_language}")
            return JsonResponse({'translations': {text: text for text in texts}, 
                               'error': f"Unsupported language: {target_language}"})
        
        if not texts or mapped_language == 'en':
            return JsonResponse({'translations': {text: text for text in texts}})
        
        translator = Translator(service_urls=['translate.google.com', 'translate.google.co.kr'])
        
        translations = {}
        
        for text in texts:
            if text:
                try:
                    translation = translator.translate(text, dest=mapped_language)
                    translations[text] = translation.text
                except Exception as e:
                    logger.error(f"Error translating text '{text}': {str(e)}")
                    translations[text] = text
            else:
                translations[text] = ''
        
        logger.info(f"Batch translated {len(texts)} texts to '{mapped_language}'")
        
        return JsonResponse({'translations': translations})
        
    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body")
        return JsonResponse({'error': 'Invalid JSON in request body'}, status=400)
    
    except Exception as e:
        logger.error(f"Batch translation error: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500) 