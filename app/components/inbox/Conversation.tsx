import Image from "next/image";
const Conversation = () => {
    return (
        <div className="py-4 rounded-2xl hover:bg-gray-100 transition-all duration-300">
            <div className="flex justify-between items-center p-4">
                <div className="flex items-center">
                    <Image
                        src="/profile_pic_1.jpg"
                        alt="Avatar"
                        width={50}
                        height={50}
                        className="rounded-full"
                    />
                    <div className="ml-2">
                        <h1 className="text-lg font-semibold">John Doe</h1>
                        <p className="text-sm text-gray-500">Last message</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Conversation;