import Conversation from "@/app/components/inbox/Conversation";

const InboxPage = () => {
    return (
        <main className="max-w-[1500px] mx-auto px-6 pb-6">
            <h1 className="text-3xl font-semibold my-8 ml-4">Inbox</h1>
            <div className="space-y-2">
                <Conversation />
                <Conversation />
                <Conversation />
            </div>
        </main>
    );
};

export default InboxPage;