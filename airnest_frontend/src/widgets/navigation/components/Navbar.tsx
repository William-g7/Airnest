import SearchFilters from '@navigation/components/SearchFilters';
import UserNav from '@navigation/components/UserNav';
import AddPropertyButton from '@navigation/components/AddPropertyButton';
import { getBFFUserId } from '@auth/server/session';
import LanguageSwitcher from '@translation/ui/LanguageSwitcher';
import ResetLogo from '@navigation/components/ResetLogo';

const Navbar = async () => {
  const userId = await getBFFUserId();

  return (
    <nav className="w-full h-full flex items-center">
      <div className="max-w-[1500px] w-full mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        <ResetLogo />

        {/* 中栏：一个 SearchFilters，响应式控制宽度 */}
        <div className="flex-1 flex justify-center mx-4">
          <div className="w-full max-w-[220px] sm:max-w-md lg:max-w-2xl">
            <SearchFilters />
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          <AddPropertyButton />
          <UserNav userId={userId} />
          <LanguageSwitcher />
        </div>
      </div>
    </nav>

  );
};

export default Navbar;
