import {render, screen} from '@testing-library/react';
import {usePathname} from 'next/navigation';
import {Home, Settings} from 'lucide-react';
import {SidebarNav, NavItem} from '@/components/layout/sidebar-nav';

jest.mock('next/navigation', () => ({
    usePathname: jest.fn(),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

const mockItems: NavItem[] = [
    {label: 'Home', href: '/home', icon: Home},
    {label: 'Settings', href: '/settings', icon: Settings},
];

beforeEach(() => {
    mockUsePathname.mockReturnValue('/other');
    jest.clearAllMocks();
});

describe('SidebarNav', () => {

    describe('default rendering', () => {

        it('sidebarNav_defaultRender_rendersNavWithDefaultAriaLabelAndAllItems', () => {
            // Arrange
            mockUsePathname.mockReturnValue('/other');
            render(<SidebarNav items={mockItems}/>);

            // Assert
            expect(screen.getByRole('navigation', {name: 'Navigation'})).toBeInTheDocument();
            expect(screen.getByRole('link', {name: 'Home'})).toBeInTheDocument();
            expect(screen.getByRole('link', {name: 'Settings'})).toBeInTheDocument();
        });

        it('sidebarNav_customAriaLabel_setsAriaLabelOnNavElement', () => {
            // Arrange
            mockUsePathname.mockReturnValue('/other');
            render(<SidebarNav items={mockItems} ariaLabel="Main navigation"/>);

            // Assert
            expect(
                screen.getByRole('navigation', {name: 'Main navigation'}),
            ).toBeInTheDocument();
        });

        it('sidebarNav_emptyItems_rendersNavWithNoLinks', () => {
            // Arrange
            mockUsePathname.mockReturnValue('/other');
            render(<SidebarNav items={[]}/>);

            // Assert
            expect(screen.getByRole('navigation')).toBeInTheDocument();
            expect(screen.queryAllByRole('link')).toHaveLength(0);
        });

    });

    describe('active state', () => {

        it('sidebarNav_pathnameMatchesItemHref_linkReceivesActiveStyles', () => {
            // Arrange
            mockUsePathname.mockReturnValue('/home');
            render(<SidebarNav items={mockItems}/>);

            // Assert
            expect(screen.getByRole('link', {name: 'Home'})).toHaveClass(
                'bg-blue-50',
                'text-blue-700',
            );
        });

        it('sidebarNav_pathnameDoesNotMatchItemHref_linkReceivesInactiveStyles', () => {
            // Arrange
            mockUsePathname.mockReturnValue('/other');
            render(<SidebarNav items={mockItems}/>);

            // Assert
            const homeLink = screen.getByRole('link', {name: 'Home'});
            expect(homeLink).toHaveClass('text-gray-600');
            expect(homeLink).not.toHaveClass('bg-blue-50');
        });

        it('sidebarNav_pathnameStartsWithItemHref_linkTreatedAsActive', () => {
            // Arrange
            mockUsePathname.mockReturnValue('/home/dashboard');
            render(<SidebarNav items={mockItems}/>);

            // Assert
            expect(screen.getByRole('link', {name: 'Home'})).toHaveClass(
                'bg-blue-50',
                'text-blue-700',
            );
        });

        it('sidebarNav_multipleItemsOneActive_onlyMatchingItemHasActiveStyles', () => {
            // Arrange
            mockUsePathname.mockReturnValue('/settings');
            render(<SidebarNav items={mockItems}/>);

            // Assert
            expect(screen.getByRole('link', {name: 'Settings'})).toHaveClass(
                'bg-blue-50',
                'text-blue-700',
            );
            const homeLink = screen.getByRole('link', {name: 'Home'});
            expect(homeLink).not.toHaveClass('bg-blue-50');
            expect(homeLink).toHaveClass('text-gray-600');
        });

    });

    describe('link attributes', () => {

        it('sidebarNav_itemsRendered_eachLinkHasCorrectHref', () => {
            // Arrange
            mockUsePathname.mockReturnValue('/other');
            render(<SidebarNav items={mockItems}/>);

            // Assert
            expect(screen.getByRole('link', {name: 'Home'})).toHaveAttribute(
                'href',
                '/home',
            );
            expect(screen.getByRole('link', {name: 'Settings'})).toHaveAttribute(
                'href',
                '/settings',
            );
        });

    });

});