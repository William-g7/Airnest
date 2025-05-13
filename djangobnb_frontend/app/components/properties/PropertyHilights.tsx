import { PropertyType } from "@/app/constants/propertyType";

// 暂时硬编码所有亮点数据，未来需要从评论区中获取
export const allHighlights: Record<string, Record<string, string[]>> = {
    en: {
        '1': ['Stunning view', 'Female-friendly'],
        '2': ['Luxury amenities', 'Professional service'],
        '3': ['Private kitchen', 'Quiet environment'],
        '4': ['Close to city center'],
        '5': ['Dog-friendly', 'Family-friendly'],
        '6': ['Free airport shuttle'],
        '7': ['Sheep shearing experience', 'Excellent soundproofing'],
        '8': ['Free room upgrade', 'Complimentary lounge access'],
        '9': ['Feel like nobility'],
        '10': ['Huge swimming pool'],
        '11': ['Thrilling sledding experience'],
        '12': ['Visited by birds and squirrels'],
        '13': ['Historic building', 'Local cuisine'],
        'default': ['Great location', 'Excellent value']
    },
    zh: {
        '1': ['“视野超棒”', '“女性友好”'],
        '2': ['“豪华设施”', '“专业服务”'],
        '3': ['“自带厨房”', '“环境宁静”'],
        '4': ['“靠近市中心”'],
        '5': ['“狗狗友好”', '“适合家庭”'],
        '6': ['“免费接送机”'],
        '7': ['“体验剪羊毛”', '“隔音超棒”'],
        '8': ['“主动升房”', '“免费酒廊”'],
        '9': ['“感觉自己变成了贵族”'],
        '10': ['“超大游泳池”'],
        '11': ['“超刺激的雪橇体验”'],
        '12': ['“有很多小鸟和松鼠做客”'],
        '13': ['“古老建筑”', '“当地美食”'],
        'default': ['“绝佳位置”', '“超值体验”']
    },
    fr: {
        '1': ['Vue spectaculaire', 'Adapté aux femmes'],
        '2': ['Équipements luxueux', 'Service professionnel'],
        '3': ['Cuisine privée', 'Environnement paisible'],
        '4': ['Proche du centre-ville'],
        '5': ['Acceptant les chiens', 'Adapté aux familles'],
        '6': ['Navette aéroport gratuite'],
        '7': ['Tonte de moutons', 'Excellente insonorisation'],
        '8': ['Surclassement offert', 'Accès gratuit au salon'],
        '9': ['Sensation de noblesse'],
        '10': ['Immense piscine'],
        '11': ['Expérience de luge palpitante'],
        '12': ['Visité par des oiseaux et des écureuils'],
        '13': ['Bâtiment ancien', 'Cuisine locale'],
        'default': ['Excellent emplacement', 'Très bon rapport qualité-prix']
    }
};

const highlightAssignments: Record<string, string> = {};
const usedHighlightIds: string[] = [];
let nextHighlightIndex = 1;

const getNextHighlightId = (): string => {
    if (usedHighlightIds.length >= 13) {
        usedHighlightIds.length = 0;
    }

    let candidateId: string;
    do {
        candidateId = nextHighlightIndex.toString();
        nextHighlightIndex = nextHighlightIndex % 13 + 1;
    } while (usedHighlightIds.includes(candidateId));

    usedHighlightIds.push(candidateId);
    return candidateId;
};

export const getReviewHighlights = (property: PropertyType, locale: string) => {
    const localeHighlights = allHighlights[locale] || allHighlights.en;

    if (!highlightAssignments[property.id]) {
        highlightAssignments[property.id] = getNextHighlightId();
    }

    const highlightId = highlightAssignments[property.id];

    return localeHighlights[highlightId] || localeHighlights.default;
};
