import Image from "next/image";
import Link from "next/link";
import SearchFilters from "./SearchFilters";
import UserNav from "./UserNav";
import AddPropertyButton from "./AddPropertyButton";
import { getUserId } from "@/app/auth/session";

const Navbar = async () => {
    const userId = await getUserId();
    return (
        <nav className="w-full fixed top-0 left-0 py-6 right-0 z-20 bg-white z-10">
            <div className="max-w-[1500px]mx-auto px-6">
                <div className="flex justify-between items-center">
                    <Link href="/">
                        <Image src="/logo.png" alt="logo" width={100} height={38} />
                    </Link>

                    <div className="flex space-x-4 items-center">
                        <SearchFilters />
                    </div>

                    <div className="flex space-x-4 items-center">
                        <AddPropertyButton />
                        <UserNav userId={userId} />
                    </div>

                </div>
            </div>


        </nav>
    )
};

export default Navbar;
