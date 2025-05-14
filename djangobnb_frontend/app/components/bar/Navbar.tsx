import SearchFilters from './SearchFilters';
import UserNav from './UserNav';
import AddPropertyButton from './AddPropertyButton';
import { getUserId } from '@/app/auth/session';
import LanguageSwitcher from './LanguageSwitcher';
import ResetLogo from './ResetLogo';

const Navbar = async () => {
  const userId = await getUserId();

  return (
    <nav className="w-full h-full flex items-center transition-all duration-300">
      <div className="max-w-[1500px] w-full mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center">
          <ResetLogo />

          <div className="hidden lg:block flex-1 mx-6 max-w-2xl">
            <SearchFilters />
          </div>

          <div className="lg:hidden flex-1 flex justify-center">
            <SearchFilters />
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <AddPropertyButton />
            <UserNav userId={userId} />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
