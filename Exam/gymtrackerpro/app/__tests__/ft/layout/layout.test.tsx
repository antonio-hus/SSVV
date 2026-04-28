import {render, screen} from '@testing-library/react';
import RootLayout, {metadata} from '@/app/layout';

jest.mock('next/font/google', () => ({
    Inter: jest.fn(() => ({
        variable: 'mock-inter-variable',
    })),
}));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('RootLayout', () => {

    describe('children', () => {

        it('rootLayout_childrenProp_renderedInsideBody', () => {
            // Arrange
            render(<RootLayout><p>child content</p></RootLayout>);

            // Assert
            expect(screen.getByText('child content')).toBeInTheDocument();
        });

    });

    describe('html element', () => {

        it('rootLayout_htmlElement_hasLangAttributeEn', () => {
            // Arrange
            render(<RootLayout><p>child content</p></RootLayout>);

            // Assert
            expect(document.documentElement).toHaveAttribute('lang', 'en');
        });

        it('rootLayout_htmlElement_hasFontCssVariableClass', () => {
            // Arrange
            render(<RootLayout><p>child content</p></RootLayout>);

            // Assert
            expect(document.documentElement).toHaveClass('mock-inter-variable');
        });

    });

    describe('metadata', () => {

        it('rootLayout_metadata_titleIsGymTrackerPro', () => {
            // Assert
            expect(metadata.title).toBe('GymTracker Pro');
        });

        it('rootLayout_metadata_descriptionIsCorrect', () => {
            // Assert
            expect(metadata.description).toBe('Gym management and workout tracking platform');
        });

    });

});