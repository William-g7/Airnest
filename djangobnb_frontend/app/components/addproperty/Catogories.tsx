import Image from 'next/image'
import { propertyCategories } from '@/app/constants/propertyCategores'

interface CategoryProps {
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
}

const Categories: React.FC<CategoryProps> = ({ selectedCategory, setSelectedCategory }) => {
    return (
        <div className="grid grid-cols-3 gap-4">
            {propertyCategories.map((category) => (
                <div
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`
                    p-4 flex flex-col items-center gap-2 border rounded-xl cursor-pointer hover:border-black transition
                    ${selectedCategory === category.value ? 'border-black' : 'border-gray-200'}
                `}
                >
                    <div className="w-10 h-10 relative">
                        <Image
                            src={category.icon}
                            alt={category.label}
                            fill
                            className="object-contain"
                        />
                    </div>
                    <div className="font-medium">{category.label}</div>
                </div>
            ))}
        </div>
    )
}

export default Categories;