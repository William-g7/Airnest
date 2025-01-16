'use client'

import CustomButton from "../forms/CustomButton";

const ConversationDetail = () => {
    return (
        <div className="h-[calc(100vh-150px)] flex flex-col">
            {/* Chat Header */}
            <div className="border-b pt-4">
                <h2 className="text-xl font-semibold">John Doe</h2>
                <p className="text-sm text-gray-500">Usually responds within 1 hour</p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex justify-end">
                    <div className="bg-airbnb text-white rounded-xl p-3 max-w-[70%]">
                        <p>Hello, how are you?</p>
                    </div>
                </div>

                <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-xl p-3 max-w-[70%]">
                        <p>Hi! I'm good, thanks for asking!</p>
                    </div>
                </div>
            </div>

            {/* Message Input */}
            <div className="border-t p-4">
                <div className="flex space-x-4">
                    <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-airbnb"
                    />

                    <CustomButton
                        label='Send'
                        className="w-[100px]"
                        onClick={() => console.log('Send')}
                    />
                </div>
            </div>
        </div>
    );
};

export default ConversationDetail;