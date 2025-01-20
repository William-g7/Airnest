'use client'

interface PropertyDetailsFormProps {
    details: PropertyDetailsType;
    setDetails: (details: PropertyDetailsType) => void;
}

interface PropertyDetailsType {
    title: string;
    description: string;
    price: number;
}

const MAX_TITLE_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 500;

const PropertyDetailsForm: React.FC<PropertyDetailsFormProps> = ({ details, setDetails }) => {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <label className="block text-xl mb-2">Give your place a title</label>
                <div>
                    <input
                        type="text"
                        value={details.title}
                        onChange={(e) => {
                            if (e.target.value.length <= MAX_TITLE_LENGTH) {
                                setDetails({ ...details, title: e.target.value })
                            }
                        }}
                        placeholder="Example: Cozy Beachfront Villa"
                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                        maxLength={MAX_TITLE_LENGTH}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                        {details.title.length}/{MAX_TITLE_LENGTH} characters
                    </p>
                </div>
            </div>

            <div>
                <label className="block text-xl mb-2">Add a description</label>
                <div>
                    <textarea
                        value={details.description}
                        onChange={(e) => {
                            if (e.target.value.length <= MAX_DESCRIPTION_LENGTH) {
                                setDetails({ ...details, description: e.target.value })
                            }
                        }}
                        placeholder="Share what makes your place special..."
                        rows={5}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                        maxLength={MAX_DESCRIPTION_LENGTH}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                        {details.description.length}/{MAX_DESCRIPTION_LENGTH} characters
                    </p>
                </div>
            </div>

            <div>
                <label className="block text-xl mb-2">Set your price per night</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                        type="number"
                        value={details.price}
                        onChange={(e) => setDetails({ ...details, price: parseInt(e.target.value) || 0 })}
                        min="0"
                        placeholder="0"
                        className="w-full p-4 pl-8 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                    />
                </div>
            </div>
        </div>
    );
};

export default PropertyDetailsForm;