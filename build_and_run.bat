@echo off
REM Build and run verify_problems.cpp with Visual Studio toolchain

REM Setup Visual Studio environment
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"

REM Compile the C++ program
echo Compiling verify_problems.cpp...
cl /EHsc /O2 verify_problems.cpp /Fe:verify_problems.exe

if %ERRORLEVEL% NEQ 0 (
    echo Compilation failed!
    pause
    exit /b 1
)

echo Compilation successful!
echo.
echo Running verification program...
echo This will take a few minutes...
echo.

REM Run and save output
verify_problems.exe > new_problems.txt

echo.
echo Done! Output saved to new_problems.txt
echo.
pause
